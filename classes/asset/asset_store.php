<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Storage of artwork.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\asset;

/**
 * Metadata in the database and bytes in the Moodle file storage, so backups, deduplication and object stores apply.
 */
class asset_store {
    /** @var string Table name. */
    private const TABLE = 'local_iconrestyle_asset';

    /** @var \moodle_database Database. */
    private $db;

    /**
     * Create the store.
     *
     * @param \moodle_database $db Database.
     */
    public function __construct(\moodle_database $db) {
        $this->db = $db;
    }

    /**
     * Find an asset by id.
     *
     * @param int $id Asset id.
     * @return asset|null Asset or null.
     */
    public function find(int $id): ?asset {
        $record = $this->db->get_record(self::TABLE, ['id' => $id]);
        return $record ? $this->to_asset($record) : null;
    }

    /**
     * Find an asset by content hash.
     *
     * @param string $hash SHA-256.
     * @return asset|null Asset or null.
     */
    public function find_by_hash(string $hash): ?asset {
        $record = $this->db->get_record(self::TABLE, ['contenthash' => $hash]);
        return $record ? $this->to_asset($record) : null;
    }

    /**
     * Store sanitised artwork, reusing an existing asset with the same content.
     *
     * @param sanitized_content $content Safe artwork.
     * @param string $source Where it came from: upload, library or import.
     * @param string|null $sourceref Provenance such as a library icon, as text only.
     * @param string|null $license Licence identifier of library artwork.
     * @param int $userid User who added it.
     * @return asset Stored asset.
     */
    public function save(sanitized_content $content, string $source, ?string $sourceref, ?string $license, int $userid): asset {
        $existing = $this->find_by_hash($content->hash());
        if ($existing) {
            return $existing;
        }
        $transaction = $this->db->start_delegated_transaction();
        try {
            $id = $this->db->insert_record(self::TABLE, (object)[
                'contenthash' => $content->hash(),
                'kind' => $content->kind(),
                'bytes' => strlen($content->bytes()),
                'width' => $content->width(),
                'height' => $content->height(),
                'monochrome' => (int)$content->monochrome(),
                'source' => $source,
                'sourceref' => $sourceref,
                'license' => $license,
                'usermodified' => $userid,
                'timecreated' => time(),
            ]);
            get_file_storage()->create_file_from_string([
                'contextid' => \context_system::instance()->id,
                'component' => 'local_iconrestyle',
                'filearea' => 'asset',
                'itemid' => $id,
                'filepath' => '/',
                'filename' => $content->hash() . '.' . $content->kind(),
                'userid' => $userid ?: null,
            ], $content->bytes());
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
        }
        $transaction->allow_commit();
        return $this->find($id);
    }

    /**
     * Bytes of an asset.
     *
     * @param asset $asset Asset.
     * @return string Safe bytes.
     * @throws \moodle_exception When the stored file is missing.
     */
    public function content(asset $asset): string {
        $file = get_file_storage()->get_file(
            \context_system::instance()->id,
            'local_iconrestyle',
            'asset',
            $asset->id(),
            '/',
            $asset->filename()
        );
        if (!$file) {
            throw new \moodle_exception('assetmissing', 'local_iconrestyle');
        }
        return $file->get_content();
    }

    /**
     * Convert a row to an asset.
     *
     * @param \stdClass $record Row.
     * @return asset Asset.
     */
    private function to_asset(\stdClass $record): asset {
        return new asset(
            (int)$record->id,
            $record->contenthash,
            $record->kind,
            (int)$record->bytes,
            (int)$record->width,
            (int)$record->height,
            (bool)$record->monochrome
        );
    }
}
