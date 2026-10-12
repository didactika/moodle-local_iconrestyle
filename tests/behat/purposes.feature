@local @local_iconrestyle @javascript
Feature: Activity purposes and the box around their icons
  In order to decide how activities look without Moodle's purpose colours
  As an administrator
  I need to keep, remove or replace the colour of each purpose, and to put the icon in a box

  Background:
    Given the following "courses" exist:
      | fullname | shortname |
      | Course A | CA        |
    And the following "activities" exist:
      | activity | name  | course | idnumber |
      | assign   | Essay | CA     | ESSAY    |
      | forum    | Talk  | CA     | TALK     |

  Scenario: Removing the colour of a purpose leaves the other purposes as Moodle draws them
    Given the following "local_iconrestyle > rules" exist:
      | slot               | bg          | fg      |
      | purpose:assessment | transparent | #000000 |
    And I log in as "admin"
    When I am on "CA" course homepage
    Then the box of the "assessment" activities should have "background-color" "rgba(0, 0, 0, 0)"
    And the glyph of the "assessment" activities should have "filter" "drop-shadow(rgb(0, 0, 0) 1000px 0px 0px)"
    And the glyph of the "collaboration" activities should not have "filter" "drop-shadow(rgb(0, 0, 0) 1000px 0px 0px)"

  Scenario: The glyph of a purpose takes any colour and really shows it
    Given the following "local_iconrestyle > rules" exist:
      | slot               | fg      |
      | purpose:assessment | #e83e8c |
    And I log in as "admin"
    When I am on "CA" course homepage
    Then the glyph of the "assessment" activities should show "#e83e8c"

  Scenario: A rule on one kind of activity reaches only that kind
    Given the following "local_iconrestyle > rules" exist:
      | slot           | bg      |
      | activity:forum | #e83e8c |
    And I log in as "admin"
    When I am on "CA" course homepage
    Then the box of the "collaboration" activities should have "background-color" "rgb(232, 62, 140)"
    And the box of the "assessment" activities should not have "background-color" "rgb(232, 62, 140)"

  Scenario: The designer removes the colour of a purpose with one button
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "purpose assessment"
    And I wait until "[data-key='purpose:assessment']" "css_element" exists
    And I click on "[data-key='purpose:assessment']" "css_element"
    And I click on "[data-look='flat']" "css_element"
    And the changes are saved
    And I click on "[data-look='flat']" "css_element"
    And the changes are saved
    When I am on "CA" course homepage
    Then the box of the "assessment" activities should have "background-color" "rgba(0, 0, 0, 0)"
    And the glyph of the "assessment" activities should have "transform" "matrix(1, 0, 0, 1, -1000, 0)"
    And the glyph of the "assessment" activities should not have "filter" "drop-shadow(rgb(255, 255, 255) 1000px 0px 0px)"

  Scenario: The designer puts the icons of a purpose in a rounded box
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "purpose collaboration"
    And I wait until "[data-key='purpose:collaboration']" "css_element" exists
    And I click on "[data-key='purpose:collaboration']" "css_element"
    And I click on "[data-look='box']" "css_element"
    And the changes are saved
    When I am on "CA" course homepage
    Then the box of the "collaboration" activities should not have "border-top-left-radius" "0px"

  Scenario: An activity icon can be replaced by an icon of your own, like any other icon
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "purpose assessment"
    And I wait until "[data-key='purpose:assessment']" "css_element" exists
    And I click on "[data-key='purpose:assessment']" "css_element"
    And I choose the artwork fixture "triangle"
    And I wait until "[data-action='remove-artwork']:not([hidden])" "css_element" exists
    And the changes are saved
    When I am on "CA" course homepage
    Then the glyph of the "assessment" activities should have "visibility" "hidden"
    And the box of the "assessment" activities should have "position" "relative"

  Scenario: A rule on an activity type reaches the box wherever Moodle draws it, not only on the course page
    Given the following "local_iconrestyle > rules" exist:
      | slot            | bg      |
      | activity:assign | #e83e8c |
    And I log in as "admin"
    When I am on the "Essay" "assign activity" page
    Then the box of the "assessment" activities should have "background-color" "rgb(232, 62, 140)"

  Scenario: The activity chooser and the page of the activity show the rule of an activity type
    Given the following "local_iconrestyle > rules" exist:
      | slot            | bg      |
      | activity:assign | #e83e8c |
    And I log in as "admin"
    And I am on "CA" course homepage with editing mode on
    When I open the activity chooser
    Then the box of "assign" in the activity chooser should have "background-color" "rgb(232, 62, 140)"
