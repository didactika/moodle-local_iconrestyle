@local @local_iconrestyle @javascript @iconrestyle_manual
Feature: The screenshots of the user manual
  In order to keep the user manual true to the interface
  As a maintainer
  I need the screenshots of the manual to be taken from the real designer, with data that makes them worth looking at
  and with numbers over the controls that the text of the manual explains

  Background:
    Given the following "categories" exist:
      | name            | category | idnumber |
      | Faculty of Arts | 0        | ARTS     |
    And the following "courses" exist:
      | fullname    | shortname | category |
      | Biology 101 | BIO101    | ARTS     |
    And the following "activities" exist:
      | activity | name         | course | idnumber |
      | assign   | Assignment 1 | BIO101 | A1       |
    And the following "local_iconrestyle > rules" exist:
      | slot             | fg      | bg      | design                                                                         |
      | core:a/setting   | #ffffff | #0f6cbf | {"shape":"circle","pt":30,"pr":30,"pb":30,"pl":30,"shadow":"soft"}             |
      | core:t/delete    | #c0392b |         | {"shape":"rounded","bw":2,"bs":"solid","bc":"#c0392b","pt":25,"pr":25,"pb":25,"pl":25} |
      | core:t/edit      | #8e44ad |         | {"hover":"grow","ds":"soft"}                                                   |
      | core:i/hide      | #1e8449 |         | {"scale":125,"rotate":10}                                                      |
      | core:i/show      | #d35400 |         | {"bg2":"#f1c40f","gd":135,"shape":"pill","pt":20,"pr":40,"pb":20,"pl":40}        |
    And I log in as "admin"
    And I change viewport size to "1500x1200"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I wait "2" seconds

  Scenario: The designer and the menu of the bar
    When I mark the page with:
      | selector                       | number | where     |
      | [data-action='history-back']   | 1      | top-left  |
      | [data-region='search']         | 2      | top-left  |
      | [data-action='filters-toggle'] | 3      | top-left  |
      | [data-action='selection-start'] | 4     | top-left  |
      | [data-region='count']          | 5      | top-left  |
      | [data-region='status']         | 6      | top-left  |
      | [data-action='undo']           | 7      | top-left  |
      | [data-action='menu-toggle']    | 8      | top-right |
      | [data-region='grid']           | 9      | top-left  |
      | [data-key='core:a/setting']    | 10     | top-left  |
    And I capture the page as "designer-overview"
    And I clear the marks
    And I click on "[data-action='menu-toggle']" "css_element"
    And I wait until "[data-region='menu']:not([hidden])" "css_element" exists
    And I mark the page with:
      | selector                           | number | where |
      | [data-action='exchange-export']    | 1      | left  |
      | [data-action='exchange-import']    | 2      | left  |
    And I capture the area "[data-region='menu']" as "toolbar-menu"

  Scenario: The editing panel and its preview
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I wait until "[data-region='preview']" "css_element" exists
    And I wait "2" seconds
    And I capture the page as "designer-open"
    And I mark the page with:
      | selector                           | number | where     |
      | [data-region='title']              | 1      | top-left  |
      | [data-region='origin']             | 2      | top-right |
      | [data-action='copy-look']          | 3      | top-left  |
      | [data-action='close-panel']        | 4      | top-right |
      | .irs-preview-head .irs-seg-group   | 5      | top-left  |
      | [data-region='preview-surface']    | 6      | top-left  |
      | .irs-tabs                          | 7      | top-left  |
    And I capture the area "[data-region='panel']" as "panel-overview"

  Scenario: Every group of the style tab, with its controls numbered
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I wait until "[data-region='preview']" "css_element" exists
    And I wait "2" seconds
    And I show only the group "Quick looks" of the editing panel
    And I mark the page with:
      | selector                | number | where     |
      | .irs-looks              | 1      | top-left  |
      | [data-look='tile']      | 2      | top-left  |
      | [data-look='badge']     | 3      | top-left  |
      | [data-look='outline']   | 4      | top-left  |
      | .irs-looks + .irs-hint  | 5      | top-left  |
    And I capture the area "[data-region='panel']" as "edit-quick-looks"
    And I show only the group "Colour" of the editing panel
    And I mark the page with:
      | selector                        | number | where     |
      | [data-region='fg-picker']       | 1      | top-left  |
      | [data-region='fg-hex']          | 2      | top-left  |
      | [data-action='clear-fg']        | 3      | bottom-left |
      | [data-region='fg-themeinput']   | 4      | top-left  |
      | [data-colour='bg']              | 5      | left      |
      | [data-colour='bg2']             | 6      | left      |
      | #irs-gd                         | 7      | left      |
      | [data-prop-num='gd']            | 8      | top-right |
    And I capture the area "[data-region='panel']" as "edit-colour"
    And I click on "[data-region='fg-themeinput']" "css_element"
    And I wait until "[data-region='fg-themepanel']:not([hidden])" "css_element" exists
    And I mark the page with:
      | selector                           | number | where |
      | [data-region='fg-themeinput']      | 1      | left  |
      | [data-region='fg-themepanel']      | 2      | right |
      | .irs-theme-item                    | 3      | right |
    And I capture the page as "edit-theme-colours"
    And I clear the marks
    And I press the escape key
    And I show only the group "Replace the icon" of the editing panel
    And I mark the page with:
      | selector                     | number | where     |
      | .irs-upload                  | 1      | top-left  |
      | [data-region='artwork-chip'] | 2      | top-left  |
    And I capture the area "[data-region='panel']" as "edit-artwork"
    And I show only the group "Shape and border" of the editing panel
    And I mark the page with:
      | selector               | number | where     |
      | [data-prop='shape']    | 1      | top-left  |
      | #irs-radius            | 2      | left      |
      | #irs-bw                | 3      | left      |
      | #irs-bs                | 4      | left      |
      | [data-colour='bc']     | 5      | left      |
      | #irs-ow                | 6      | left      |
      | #irs-oo                | 7      | left      |
      | [data-colour='oc']     | 8      | left      |
    And I capture the area "[data-region='panel']" as "edit-shape"
    And I show only the group "Spacing and size" of the editing panel
    And I mark the page with:
      | selector                           | number | where     |
      | [data-sides='padding']             | 1      | top-left  |
      | [data-sides='padding'] .irs-link   | 2      | top-right |
      | [data-sides='margin']              | 3      | top-left  |
      | #irs-scale                         | 4      | left      |
    And I capture the area "[data-region='panel']" as "edit-spacing"
    And I show only the group "Rotation and flip" of the editing panel
    And I mark the page with:
      | selector            | number | where |
      | #irs-rotate         | 1      | left  |
      | #irs-skx            | 2      | left  |
      | #irs-sky            | 3      | left  |
      | [data-flip='flipx'] | 4      | left  |
      | [data-flip='flipy'] | 5      | right |
    And I capture the area "[data-region='panel']" as "edit-transform"
    And I show only the group "Effects" of the editing panel
    And I mark the page with:
      | selector            | number | where |
      | #irs-opacity        | 1      | left  |
      | #irs-shadow         | 2      | left  |
      | #irs-ds             | 3      | left  |
      | [data-colour='sc']  | 4      | left  |
      | #irs-blend          | 5      | left  |
      | #irs-hover          | 6      | left  |
    And I capture the area "[data-region='panel']" as "edit-effects"
    And I show only the group "Filters" of the editing panel
    And I mark the page with:
      | selector          | number | where |
      | #irs-brightness   | 1      | left  |
      | #irs-contrast     | 2      | left  |
      | #irs-saturate     | 3      | left  |
      | #irs-grayscale    | 4      | left  |
      | #irs-hue          | 5      | left  |
      | #irs-sepia        | 6      | left  |
      | #irs-invert       | 7      | left  |
      | #irs-blur         | 8      | left  |
    And I capture the area "[data-region='panel']" as "edit-filters"

  Scenario: Places, copying and the choice of icons
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I wait until "[data-region='preview']" "css_element" exists
    And I click on "[data-tab='places']" "css_element"
    And I wait "1" seconds
    And I mark the page with:
      | selector                    | number | where     |
      | [data-region='variants']    | 1      | top-left  |
      | [data-action='add-places']  | 2      | top-left  |
    And I capture the area "[data-region='panel']" as "places"
    And I clear the marks
    And I click on "[data-action='add-places']" "css_element"
    And the places modal is open
    And I wait "1" seconds
    And I mark the page with:
      | selector                                  | number | where     |
      | .modal.show .irs-seg                      | 1      | top-left  |
      | .modal.show [data-region='where-page']    | 2      | top-left  |
      | .modal.show [data-region='places-copy']   | 3      | top-left  |
      | .modal-footer [data-action='cancel']      | 4      | top-left  |
    And I capture the page as "places-modal"
    And I clear the marks
    And I click on ".modal-footer [data-action='cancel']" "css_element"
    And the places modal is closed
    And I click on "[data-action='copy-look']" "css_element"
    And I wait until ".irs-selbar:not([hidden])" "css_element" exists
    And I wait "1" seconds
    And I mark the page with:
      | selector                                | number | where     |
      | [data-region='selection-bar']           | 1      | top-left  |
      | .irs-selbar-what                        | 2      | top-left  |
      | [data-action='selection-all']           | 3      | top-left  |
      | [data-action='selection-apply']         | 4      | top-left  |
      | [data-action='selection-cancel']        | 5      | top-right |
    And I capture the page as "copy-look"
    And I clear the marks
    And I click on "[data-action='selection-cancel']" "css_element"
    And I click on "[data-action='close-panel']" "css_element"
    And I set the field "Search icons" to ""
    And I click on "[data-action='filters-toggle']" "css_element"
    And I wait until ".irs-filters-panel:not([hidden])" "css_element" exists
    And I click on ".irs-filters-panel input[data-filter='traits'][value='modified']" "css_element"
    And I wait "1" seconds
    And I mark the page with:
      | selector                                  | number | where     |
      | .irs-filter-head                          | 1      | top-left  |
      | [data-action='filters-clear']             | 2      | top-right |
      | .irs-filter-section .irs-filter-chips     | 3      | top-left  |
      | [data-region='filters-sort']              | 4      | top-left  |
    And I capture the page as "filters"
    And I clear the marks
    And I click on "[data-region='count']" "css_element"
    And I click on "[data-action='selection-start']" "css_element"
    And I wait until ".irs-selbar:not([hidden])" "css_element" exists
    And I click on "[data-action='selection-all']" "css_element"
    And I wait "1" seconds
    And I mark the page with:
      | selector                                | number | where     |
      | [data-region='selection-bar']           | 1      | top-left  |
      | [data-region='selection-count']         | 2      | top-left  |
      | [data-action='selection-all']           | 3      | top-left  |
      | [data-action='selection-none']          | 4      | top-left  |
      | [data-action='selection-apply']         | 5      | top-left  |
    And I capture the page as "select-export"

  Scenario: Importing a package, the settings and the result on the site
    When I choose the package fixture "sample"
    And I wait until ".modal.show [data-region='import-form']" "css_element" exists
    And I wait "2" seconds
    And I mark the page with:
      | selector                           | number | where     |
      | [data-region='import-summary']     | 1      | top-left  |
      | .modal.show .irs-seg-wide          | 2      | top-left  |
      | [data-region='import-search']      | 3      | top-left  |
      | [data-action='review-all']         | 4      | top-left  |
      | [data-region='import-rows']        | 5      | top-left  |
      | [data-region='import-report']      | 6      | top-left  |
    And I capture the page as "import-review"
    And I clear the marks
    And I click on ".modal-footer [data-action='cancel']" "css_element"
    And I navigate to "Plugins > Local plugins > Icon Restyle > Settings" in site administration
    And I wait "1" seconds
    And I capture the page as "settings"
    And I am on "BIO101" course homepage with editing mode on
    And I open "Assignment 1" actions menu
    And I wait "1" seconds
    And I capture the page as "result-site"

  Scenario: The designer on a phone
    When I change viewport size to "420x860"
    And I reload the page
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I wait "2" seconds
    And I capture the page as "mobile"

  Scenario: The designer in the dark mode
    Given colour modes are turned on
    When I reload the page
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I switch the page to dark mode
    And I wait "2" seconds
    And I capture the page as "colour-modes-dark"
