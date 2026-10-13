@local @local_iconrestyle @javascript
Feature: Customisations travel between sites
  In order to give several campuses the same look without doing it twice
  As an administrator
  I need to import the customisations of another site and see what that does before it happens

  Background:
    Given the following "courses" exist:
      | fullname | shortname |
      | Course A | CA        |
    And I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists

  Scenario: A package is previewed, then imported, and the whole site shows it
    When I choose the package fixture "sample"
    Then I wait until ".modal.show [data-region='import-form']" "css_element" exists
    And I should see "2 rules will be added"
    When I click on ".modal-footer [data-action='save']" "css_element"
    And I wait until ".modal.show [data-region='import-form']" "css_element" does not exist
    And I am on site homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: Choosing to replace says what would be removed
    Given the following "local_iconrestyle > rules" exist:
      | slot          | fg      |
      | core:t/edit   | #112233 |
    When I reload the page
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I choose the package fixture "sample"
    Then I wait until ".modal.show [data-region='import-form']" "css_element" exists
    When I click on "//input[@id='irs-import-replace']/following-sibling::span" "xpath_element"
    Then I should see "1 rules will be removed"

  Scenario: Only the chosen icons are taken from a package
    When I choose the package fixture "sample"
    Then I wait until ".modal.show [data-region='import-form']" "css_element" exists
    And I should see "2 icons, 2 rules" in the ".modal.show [data-region='import-form']" "css_element"
    And I should see "2 of 2 icons chosen"
    When I click on ".modal.show [data-action='review-none']" "css_element"
    And I click on ".modal.show [data-region='import-row'][value='core:a/setting']" "css_element"
    Then I should see "1 of 2 icons chosen"
    And I wait "2" seconds
    And I should see "1 rules will be added"
    When I click on ".modal-footer [data-action='save']" "css_element"
    And I wait until ".modal.show [data-region='import-form']" "css_element" does not exist
    And I am on site homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: Icons are chosen in the grid to be exported
    Given the following "local_iconrestyle > rules" exist:
      | slot          | fg      |
      | core:t/edit   | #112233 |
    When I reload the page
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I click on "[data-action='selection-start']" "css_element"
    Then I wait until ".irs-selbar:not([hidden])" "css_element" exists
    And I should see "Choose the icons to export"
    And I should see "0 chosen"
    When I click on "[data-action='selection-all']" "css_element"
    Then I should see "1 chosen" in the "[data-region='selection-bar']" "css_element"
    When I click on "[data-action='selection-none']" "css_element"
    Then I should see "0 chosen" in the "[data-region='selection-bar']" "css_element"
    When I click on "[data-action='selection-cancel']" "css_element"
    Then ".irs-selbar" "css_element" should not be visible

  Scenario: The icons are narrowed with the filters panel and the filters that are on can be removed
    Given the following "local_iconrestyle > rules" exist:
      | slot          | fg      |
      | core:t/edit   | #112233 |
    When I reload the page
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I click on "[data-action='filters-toggle']" "css_element"
    Then I wait until ".irs-filters-panel:not([hidden])" "css_element" exists
    When I click on ".irs-filters-panel input[data-filter='traits'][value='colour']" "css_element"
    Then I should see "1 icons" in the "[data-region='count']" "css_element"
    And I should see "1" in the "[data-region='filters-count']" "css_element"
    When I click on "[data-action='filters-clear']" "css_element"
    Then "[data-region='filters-count']" "css_element" should not be visible
