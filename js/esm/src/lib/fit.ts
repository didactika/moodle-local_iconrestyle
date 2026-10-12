// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * Keeps an icon whose customised look has grown from covering its neighbours.
 *
 * @module     local_iconrestyle/lib/fit
 * @copyright  2026 Didactica.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Shrink every cell of a stage whose icon has grown beyond the room it may take.
 *
 * Cells take the room of their content, so the gap between icons is the same whatever they look like. A zoom, unlike a
 * transform, also changes the room an icon takes, so a large look can never cover its neighbours.
 *
 * @param stage Stage that holds the cells.
 * @param limit Largest size in pixels an icon may have.
 */
export const fitCells = (stage: HTMLElement, limit: number): void => {
    stage.querySelectorAll<HTMLElement>('.irs-cell').forEach((wrapper) => {
        const fit = wrapper.firstElementChild as HTMLElement | null;
        if (!fit) {
            return;
        }
        fit.style.zoom = '';
        const target = fit.querySelector<HTMLElement>('.activityiconcontainer, .icon, img');
        if (!target) {
            return;
        }
        const rect = target.getBoundingClientRect();
        const longest = Math.max(rect.width, rect.height);
        if (longest > limit) {
            fit.style.zoom = (limit / longest).toFixed(3);
        }
    });
};

/**
 * Scale down the icon of every card whose customised look has grown beyond the room the card gives it.
 *
 * Customisations apply on this page too, so a large scale or padding would otherwise be cut off by the card.
 *
 * @param container Element that holds the cards.
 */
export const fitCards = (container: HTMLElement): void => {
    container.querySelectorAll<HTMLElement>('.irs-card-icon').forEach((area) => {
        const fit = area.firstElementChild as HTMLElement | null;
        if (!fit || fit.classList.contains('irs-card-fit') === false) {
            return;
        }
        fit.style.zoom = '';
        const target = fit.querySelector<HTMLElement>('.activityiconcontainer, .icon, img');
        if (!target) {
            return;
        }
        const rect = target.getBoundingClientRect();
        const room = Math.min(area.clientWidth, area.clientHeight) * 0.92;
        const longest = Math.max(rect.width, rect.height);
        if (longest > room) {
            fit.style.zoom = (room / longest).toFixed(3);
        }
    });
};
