@local @local_iconrestyle @javascript
Feature: Customise icons in the designer
  In order to give the campus its own identity without writing code
  As an administrator
  I need a designer where I can find an icon, change it, see the result and save it

  Background:
    Given I log in as "admin"
    And I navigate to "Appearance > Icon appearance" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists

  Scenario: The catalogue can be searched and filtered
    Then I should see "Choose an icon to customise it."
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    Then "[data-key='core:t/delete']" "css_element" should not exist
    When I set the field "Search icons" to "no such icon anywhere"
    Then I should see "No icons match your search."

  Scenario: A colour is previewed, saved and then applied to the real pages
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I set the field "irs-fg-hex" to "#e83e8c"
    And I wait until "1 unsaved changes" "text" exists
    Then I should see "1 unsaved changes"
    And the new preview icon should have "color" "rgb(232, 62, 140)"
    When I press "Save changes"
    Then I should see "1 changes saved"
    And I am on site homepage
    And the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: Changes can be undone, redone and discarded before saving
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I set the field "irs-fg-hex" to "#e83e8c"
    And I wait until "1 unsaved changes" "text" exists
    And I press "Undo"
    Then I should see "No unsaved changes"
    When I press "Redo"
    Then I should see "1 unsaved changes"
    When I press "Discard"
    Then I should see "No unsaved changes"

  Scenario: Replacement artwork is uploaded, previewed and applied
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I choose the artwork fixture "triangle"
    And I wait until "Artwork ready: SVG" "text" exists
    And I set the field "irs-fg-hex" to "#0a6b3d"
    And I press "Save changes"
    Then I should see "changes saved"
    And I am on site homepage
    And the icon "core:a/setting" pseudo-element "::before" should have "mask-image" containing "data:image/svg+xml"
    And the icon "core:a/setting" pseudo-element "::before" should have "background-color" containing "rgb(10, 107, 61)"

  Scenario: Saved rules apply on the designer itself while its default column stays untouched
    Given the following "local_iconrestyle > rules" exist:
      | slot           | fg      |
      | core:a/setting | #e83e8c |
    When I reload the page
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    Then the current preview icon should have "color" "rgb(232, 62, 140)"
    And the default preview icon should have "color" "rgb(33, 37, 41)"

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
    And I press "Save changes"
    Then I should see "1 changes saved"
    And I am on site homepage
    And "link[href*='local/iconrestyle']" "css_element" should not exist

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
    Then I should see "Choose an icon to customise it."
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
