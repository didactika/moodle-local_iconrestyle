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
 * Raised when artwork is refused.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\asset;

/**
 * Carries a stable reason code so the interface can explain what rule the file broke.
 */
class asset_rejected_exception extends \InvalidArgumentException {
    /** @var string File is larger than allowed. */
    public const TOO_LARGE = 'toolarge';

    /** @var string File is not well-formed. */
    public const MALFORMED = 'malformed';

    /** @var string File contains a construct that is never accepted. */
    public const FORBIDDEN = 'forbidden';

    /** @var string File is not a supported image. */
    public const UNSUPPORTED = 'unsupported';

    /** @var string Image dimensions are outside the accepted range. */
    public const DIMENSIONS = 'dimensions';

    /** @var string File draws nothing. */
    public const EMPTY = 'empty';

    /** @var string The server cannot process this kind of image. */
    public const UNAVAILABLE = 'unavailable';

    /** @var string Reason code. */
    private $reason;

    /**
     * Create the exception.
     *
     * @param string $reason One of the reason constants.
     * @param string $detail Technical detail for logs.
     */
    public function __construct(string $reason, string $detail = '') {
        parent::__construct($detail === '' ? $reason : $reason . ': ' . $detail);
        $this->reason = $reason;
    }

    /**
     * Reason code.
     *
     * @return string One of the reason constants.
     */
    public function reason(): string {
        return $this->reason;
    }
}
