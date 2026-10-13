@local @local_iconrestyle @javascript
Feature: Replacement artwork is painted on the page
  In order to replace Moodle's own icons with campus artwork
  As an administrator
  I need a rule with artwork to change how real icons are painted in the browser

  Background:
    Given the following "local_iconrestyle > rules" exist:
      | slot            | svg      | painter | fg      | bg      | shape  |
      | core:a/setting  | triangle | mask    | #e83e8c | #fff3cd | circle |
      | core:i/agg_mean | triangle | mask    | #0a6b3d |         |        |
      | core:t/delete   | triangle | image   |         | #d1ecf1 |        |

  Scenario: A font icon keeps its box and draws the artwork in its pseudo-element
    Given I log in as "admin"
    And I am on site homepage
    Then the icon "core:a/setting" should have "background-color" "rgb(255, 243, 205)"
    And the icon "core:a/setting" should have "border-top-left-radius" "50%"
    And the icon "core:a/setting" pseudo-element "::before" should have "background-color" containing "rgb(232, 62, 140)"
    And the icon "core:a/setting" pseudo-element "::before" should have "mask-image" containing "data:image/svg+xml"
    And the icon "core:a/setting" should be painted "#e83e8c" inside its artwork
    And I capture the icons "core:a/setting, core:t/delete, core:t/edit" as "iconrestyle-font-icons"

  Scenario: An image icon is masked and its original image is moved out of view
    Given I log in as "admin"
    And I am on site homepage
    Then the image icon "core:i/agg_mean" should have "background-color" "rgb(10, 107, 61)"
    And the image icon "core:i/agg_mean" should have "object-position" "-9999px 0px"

  Scenario: Multicolour artwork uses a background image and leaves the background colour free
    Given I log in as "admin"
    And I am on site homepage
    Then the icon "core:t/delete" should have "background-color" "rgb(209, 236, 241)"
    And the icon "core:t/delete" pseudo-element "::before" should have "background-image" containing "data:image/svg+xml"
    And the icon "core:t/delete" should be painted "#000000" inside its artwork
