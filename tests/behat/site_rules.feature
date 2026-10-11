@local @local_iconrestyle @javascript
Feature: Site icon rules reach the page
  In order to give a campus its own identity
  As an administrator
  I need a site rule to change how Moodle's real icons are painted in the browser

  Background:
    Given the following "local_iconrestyle > rules" exist:
      | slot           | fg      | bg      | shape   |
      | core:a/setting | #e83e8c |         |         |
      | core:t/delete  | #0a6b3d | #fff3cd | rounded |

  Scenario: A recolour changes the computed colour of the real icon markup
    Given I log in as "admin"
    And I am on site homepage
    Then the page should include the icon stylesheet
    And the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"
    And the icon "core:t/delete" should have "color" "rgb(10, 107, 61)"
    And the icon "core:t/delete" should have "background-color" "rgb(255, 243, 205)"

  Scenario: Icons without a rule keep Moodle's own styling
    Given I log in as "admin"
    And I am on site homepage
    Then the icon "core:t/hide" should have "background-color" "rgba(0, 0, 0, 0)"

  Scenario: The kill switch removes the stylesheet but keeps the rules
    Given the following config values are set as admin:
      | enabled | 0 | local_iconrestyle |
    When I log in as "admin"
    And I am on site homepage
    Then "link[href*='local/iconrestyle']" "css_element" should not exist
