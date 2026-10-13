@local @local_iconrestyle @javascript
Feature: Rules apply only where they are meant to
  In order to give each part of the campus its own look from one place
  As an administrator
  I need to limit a rule to a category, a course, an activity, some pages or some parts of a page

  Background:
    Given the following "categories" exist:
      | name       | category | idnumber |
      | Faculty    | 0        | FAC      |
    And the following "courses" exist:
      | fullname | shortname | category |
      | Course A | CA        | FAC      |
      | Course B | CB        | 0        |
    And the following "activities" exist:
      | activity | name     | course | idnumber |
      | assign   | Essay    | CA     | ESSAY    |
    And the following "local_iconrestyle > rules" exist:
      | slot           | fg      |
      | core:a/setting | #e83e8c |

  Scenario: A variant limited to one course is added in a modal and only that course shows it
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I click on "[data-tab='places']" "css_element"
    And I click on "[data-action='add-places']" "css_element"
    And the places modal is open
    And I click on "//input[@name='irs-kind'][@value='course']/following-sibling::span" "xpath_element"
    And I choose the place "Course A" in the "course" field
    And I click on ".modal-footer [data-action='save']" "css_element"
    And the places modal is closed
    Then ".irs-chip.irs-active" "css_element" should be visible
    When I click on "[data-tab='style']" "css_element"
    And I set the field "irs-fg-hex" to "#0a6b3d"
    And the changes are saved
    When I am on "CA" course homepage
    Then the icon "core:a/setting" should have "color" "rgb(10, 107, 61)"
    When I am on "CB" course homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"
    When I am on site homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: Several places are added at once and each starts from the current look
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I click on "[data-tab='places']" "css_element"
    And I click on "[data-action='add-places']" "css_element"
    And the places modal is open
    And I click on "//input[@name='irs-kind'][@value='course']/following-sibling::span" "xpath_element"
    And I choose the place "Course A" in the "course" field
    And I choose the place "Course B" in the "course" field
    And I click on ".modal-footer [data-action='save']" "css_element"
    And the places modal is closed
    And the changes are saved
    When I am on "CA" course homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"
    When I am on "CB" course homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: A variant limited to administration pages leaves the rest of the site alone
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I click on "[data-tab='places']" "css_element"
    And I click on "[data-action='add-places']" "css_element"
    And the places modal is open
    And I click on "Administration pages" "checkbox"
    And I click on ".modal-footer [data-action='save']" "css_element"
    And the places modal is closed
    And I click on "[data-tab='style']" "css_element"
    And I set the field "irs-fg-hex" to "#0a6b3d"
    And the changes are saved
    When I visit the path "/admin/search.php"
    Then the icon "core:a/setting" should have "color" "rgb(10, 107, 61)"
    When I am on site homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: A category rule reaches the courses inside it and no others
    Given the following "local_iconrestyle > rules" exist:
      | slot           | category | fg      |
      | core:a/setting | FAC      | #0a6b3d |
    And I log in as "admin"
    When I am on "CA" course homepage
    Then the icon "core:a/setting" should have "color" "rgb(10, 107, 61)"
    When I am on "CB" course homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: An activity rule applies on the activity page and not on its course
    Given the following "local_iconrestyle > rules" exist:
      | slot           | activity | fg      |
      | core:a/setting | ESSAY    | #0a6b3d |
    And I log in as "admin"
    When I am on the "Essay" "assign activity" page
    Then the icon "core:a/setting" should have "color" "rgb(10, 107, 61)"
    When I am on "CA" course homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: A rule limited to a region applies only inside it
    Given the following "local_iconrestyle > rules" exist:
      | slot           | regions | fg      |
      | core:a/setting | footer  | #0a6b3d |
    And I log in as "admin"
    When I am on site homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: A place is removed with the cross on its chip, and the places every icon has show none
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I click on "[data-tab='places']" "css_element"
    Then "[data-action='remove-chip']" "css_element" should not exist
    When I click on "[data-action='add-places']" "css_element"
    And the places modal is open
    And I click on "//input[@name='irs-kind'][@value='course']/following-sibling::span" "xpath_element"
    And I choose the place "Course A" in the "course" field
    And I click on ".modal-footer [data-action='save']" "css_element"
    And the places modal is closed
    Then "[data-action='remove-chip']" "css_element" should exist
    When I click on "[data-action='remove-chip']" "css_element"
    Then "[data-action='remove-chip']" "css_element" should not exist
    And the changes are saved
