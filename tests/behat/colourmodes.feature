@local @local_iconrestyle @javascript
Feature: Every colour mode of Moodle has its own look
  In order to customise an icon the way Moodle shows it in each colour mode
  As an administrator
  I need to start from what Moodle shows in a mode, and have each look belong to one mode

  Background:
    Given colour modes are turned on
    And I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"

  Scenario: The preview opens in the mode the page is shown in and says so
    Then I should see "This page is shown in Light mode" in the ".irs-preview" "css_element"
    And the "aria-pressed" attribute of "[data-surface='light']" "css_element" should contain "true"
    When I switch the page to dark mode
    Then I should see "This page is shown in Dark mode" in the ".irs-preview" "css_element"
    And the "aria-pressed" attribute of "[data-surface='dark']" "css_element" should contain "true"

  Scenario: A look belongs to the mode it was made in, and the other mode starts from Moodle's own
    When I set the field "irs-fg-hex" to "#e83e8c"
    And the changes are saved
    And I click on "[data-surface='dark']" "css_element"
    Then the field "irs-fg-hex" matches value ""
    When I set the field "irs-fg-hex" to "#0a6b3d"
    And the changes are saved
    And I am on site homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"
    When I switch the page to dark mode
    Then the icon "core:a/setting" should have "color" "rgb(10, 107, 61)"

  Scenario: A look is copied to the other mode in one click
    When I set the field "irs-fg-hex" to "#e83e8c"
    And I click on "[data-tab='places']" "css_element"
    And I click on "[data-action='copy-mode']" "css_element"
    Then I should see "Dark mode" in the "[data-region='variants']" "css_element"
    And ".irs-chip.irs-active" "css_element" should be visible
    And the changes are saved
    When I am on site homepage
    And I switch the page to dark mode
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: The places form only offers the modes Moodle has, one at a time
    When I click on "[data-tab='places']" "css_element"
    And I click on "[data-action='add-places']" "css_element"
    And the places modal is open
    Then "input[name='irs-mode'][value='light']" "css_element" should exist
    And "input[name='irs-mode'][value='dark']" "css_element" should exist
    And "input[name='irs-mode'][value='all']" "css_element" should not exist
    And I should not see "follows the colour mode of the theme"

  Scenario: Every look of the icons that are chosen is copied from one mode to another at once
    When I set the field "irs-fg-hex" to "#e83e8c"
    And the changes are saved
    And I click on "[data-action='close-panel']" "css_element"
    And I click on "[data-action='selection-start']" "css_element"
    And I wait until ".irs-selbar:not([hidden])" "css_element" exists
    And I click on "[data-action='selection-all']" "css_element"
    Then I should see "1 chosen" in the "[data-region='selection-bar']" "css_element"
    When I click on "[data-action='selection-modes']" "css_element"
    Then I should see "Copy one mode to another" in the "[data-region='selection-bar']" "css_element"
    When I click on "[data-action='selection-apply']" "css_element"
    And the changes are saved
    And I am on site homepage
    And I switch the page to dark mode
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"
