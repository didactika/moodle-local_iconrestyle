@local @local_iconrestyle @javascript
Feature: Customise icons in the designer
  In order to give the campus its own identity without writing code
  As an administrator
  I need a designer where I can find an icon, change it and see the result, with every change saved on its own

  Background:
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists

  Scenario: The catalogue can be searched and filtered
    Then ".irs-panel" "css_element" should not be visible
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    Then "[data-key='core:t/delete']" "css_element" should not exist
    When I set the field "Search icons" to "no such icon anywhere"
    Then I should see "No icons match your search."

  Scenario: A colour is previewed, saved on its own and then applied to the real pages
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I set the field "irs-fg-hex" to "#e83e8c"
    Then the new preview icon should have "color" "rgb(232, 62, 140)"
    When the changes are saved
    And I am on site homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: A theme colour is found by searching the variables the theme declares
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I click on "[data-region='fg-themeinput']" "css_element"
    And I set the field with xpath "//input[@data-region='fg-themeinput']" to "primary"
    And I wait until "//div[@data-region='fg-themelist']//button[contains(., 'secondary')]" "xpath_element" does not exist
    And I click on "//div[@data-region='fg-themelist']//button[contains(@class, 'irs-theme-item')][contains(., 'primary')]" "xpath_element"
    Then the theme colour of "fg" should contain "primary"
    And the colour of "fg" should be written as a hex code
    And "[data-region='fg-themepanel']" "css_element" should not be visible
    When the changes are saved
    And I reload the page
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    Then the theme colour of "fg" should contain "primary"

  Scenario: What is saved shows at once on every icon of the designer page, without reloading
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I set the field "irs-fg-hex" to "#e83e8c"
    And the changes are saved
    And I click on "[data-action='close-panel']" "css_element"
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: Changes can be undone and redone with the buttons, and each one is saved and shown at once
    Given the following "local_iconrestyle > rules" exist:
      | slot           | fg      |
      | core:a/setting | #e83e8c |
    When I reload the page
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I set the field "irs-fg-hex" to "#0a6b3d"
    And the changes are saved
    Then the icon "core:a/setting" should have "color" "rgb(10, 107, 61)"
    When I click on "[data-action='undo']" "css_element"
    And the changes are saved
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"
    When I click on "[data-action='redo']" "css_element"
    And the changes are saved
    Then the icon "core:a/setting" should have "color" "rgb(10, 107, 61)"
    When I am on site homepage
    Then the icon "core:a/setting" should have "color" "rgb(10, 107, 61)"

  Scenario: The actions menu lists undo, redo, export and import
    When I click on "[data-action='menu-toggle']" "css_element"
    Then "[data-region='menu']" "css_element" should be visible
    And I should see "Export all customisations"
    And I should see "Import customisations"

  Scenario: Replacement artwork is uploaded, previewed and applied
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I choose the artwork fixture "triangle"
    And I wait until "Your SVG icon is used" "text" exists
    And I set the field "irs-fg-hex" to "#0a6b3d"
    And the changes are saved
    And I am on site homepage
    Then the icon "core:a/setting" pseudo-element "::before" should have "mask-image" containing "data:image/svg+xml"
    And the icon "core:a/setting" pseudo-element "::before" should have "background-color" containing "rgb(10, 107, 61)"

  Scenario: Saved rules apply on the designer itself while the original stays one click away
    Given the following "local_iconrestyle > rules" exist:
      | slot           | fg      |
      | core:a/setting | #e83e8c |
    When I reload the page
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    Then the new preview icon should have "color" "rgb(232, 62, 140)"
    And the default preview icon should have "color" "rgb(33, 37, 41)"
    When I click on "[data-view='original']" "css_element"
    Then "[data-area='new']" "css_element" should not be visible
    And "[data-area='default']" "css_element" should be visible
    When I click on "[data-view='compare']" "css_element"
    Then "[data-area='new']" "css_element" should be visible
    And "[data-area='default']" "css_element" should be visible

  Scenario: Resetting removes the rule again
    Given the following "local_iconrestyle > rules" exist:
      | slot           | fg      |
      | core:a/setting | #e83e8c |
    When I reload the page
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I press "Remove this customisation"
    And the changes are saved
    And I am on site homepage
    Then "link[href*='local/iconrestyle']" "css_element" should not exist

  Scenario: A site manager without the configuration permission can use the designer
    Given the following "users" exist:
      | username | firstname | lastname | email                |
      | manager1 | Manager   | One      | manager1@example.com |
    And the following "role assigns" exist:
      | user     | role    | contextlevel | reference |
      | manager1 | manager | System       |           |
    And I log out
    And I log in as "manager1"
    When I open the icon designer address
    Then I wait until "[data-region='grid-window'] .irs-card" "css_element" exists

  Scenario: The look of an icon is copied to other icons, choosing what is copied and where
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I set the field "irs-fg-hex" to "#e83e8c"
    And I click on "[data-action='copy-look']" "css_element"
    Then I wait until ".irs-selbar:not([hidden])" "css_element" exists
    And I should see "Copy the look of core:a/setting to"
    When I set the field "Search icons" to "t/delete"
    And I wait until "[data-key='core:t/delete']" "css_element" exists
    And I wait "1" seconds
    And I click on "[data-key='core:t/delete']" "css_element"
    Then I should see "1 chosen" in the "[data-region='selection-bar']" "css_element"
    When I click on "[data-action='selection-apply']" "css_element"
    And the changes are saved
    And I am on site homepage
    Then the icon "core:t/delete" should have "color" "rgb(232, 62, 140)"
