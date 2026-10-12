@local @javascript @iconrestyle_manual
Feature: The screenshots of the user manual
  In order to keep the user manual true to the interface
  As a maintainer
  I need the screenshots of the manual to be taken from the real designer, with data that makes them worth looking at

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
    And I change viewport size to "1500x900"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I wait "2" seconds

  Scenario: The designer, an open icon, the filters, the choice, the copy and the places
    When I capture the page as "designer-overview"
    And I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I wait until "[data-region='preview']" "css_element" exists
    And I wait "2" seconds
    And I capture the page as "designer-open"
    And I click on "[data-action='copy-look']" "css_element"
    And I wait until ".irs-selbar:not([hidden])" "css_element" exists
    And I wait "1" seconds
    And I capture the page as "copy-look"
    And I click on "[data-action='selection-cancel']" "css_element"
    And I click on "[data-tab='places']" "css_element"
    And I wait "1" seconds
    And I capture the page as "places"
    And I click on "[data-action='add-places']" "css_element"
    And the places modal is open
    And I wait "1" seconds
    And I capture the page as "places-modal"
    And I click on ".modal-footer [data-action='cancel']" "css_element"
    And the places modal is closed
    And I click on "[data-action='close-panel']" "css_element"
    And I set the field "Search icons" to ""
    And I click on "[data-action='filters-toggle']" "css_element"
    And I wait until ".irs-filters-panel:not([hidden])" "css_element" exists
    And I click on ".irs-filters-panel input[data-filter='traits'][value='modified']" "css_element"
    And I wait "1" seconds
    And I capture the page as "filters"
    And I click on "[data-region='count']" "css_element"
    And I click on "[data-action='selection-start']" "css_element"
    And I wait until ".irs-selbar:not([hidden])" "css_element" exists
    And I click on "[data-action='selection-all']" "css_element"
    And I wait "1" seconds
    And I capture the page as "select-export"

  Scenario: Importing a package, the settings and the result on the site
    When I choose the package fixture "sample"
    And I wait until ".modal.show [data-region='import-form']" "css_element" exists
    And I wait "2" seconds
    And I capture the page as "import-review"
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
