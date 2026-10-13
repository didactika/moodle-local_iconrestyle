@local @local_iconrestyle @javascript
Feature: What the designer saves reaches the other pages of the site
  In order to trust the designer
  As an administrator
  I need every change, and every removal, to show on the pages of Moodle that are not the designer

  Background:
    Given the following "courses" exist:
      | fullname | shortname |
      | Course A | CA        |
    And the following "activities" exist:
      | activity | name   | course | idnumber |
      | folder   | Papers | CA     | PAPERS   |
    And I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I set the field "Search icons" to "activity folder"
    And I wait until "[data-key='activity:folder']" "css_element" exists
    And I click on "[data-key='activity:folder']" "css_element"

  Scenario: Changing, replacing and removing the look of an activity icon shows on the course page each time
    When I set the field "irs-bg-hex" to "#e83e8c"
    And the changes are saved
    And I am on "CA" course homepage
    Then the box of the "content" activities should have "background-color" "rgb(232, 62, 140)"
    When I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I set the field "Search icons" to "activity folder"
    And I wait until "[data-key='activity:folder']" "css_element" exists
    And I click on "[data-key='activity:folder']" "css_element"
    And I set the field "irs-bg-hex" to "#0a6b3d"
    And the changes are saved
    And I am on "CA" course homepage
    Then the box of the "content" activities should have "background-color" "rgb(10, 107, 61)"
    When I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I set the field "Search icons" to "activity folder"
    And I wait until "[data-key='activity:folder']" "css_element" exists
    And I click on "[data-key='activity:folder']" "css_element"
    And I press "Remove this customisation"
    And the changes are saved
    And I am on "CA" course homepage
    Then the box of the "content" activities should not have "background-color" "rgb(10, 107, 61)"
    And "link[href*='local/iconrestyle']" "css_element" should not exist

  Scenario: With colour modes each change and each removal shows in its own mode
    Given colour modes are turned on
    When I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I set the field "Search icons" to "activity folder"
    And I wait until "[data-key='activity:folder']" "css_element" exists
    And I click on "[data-key='activity:folder']" "css_element"
    And I set the field "irs-bg-hex" to "#e83e8c"
    And the changes are saved
    And I click on "[data-surface='dark']" "css_element"
    And I set the field "irs-bg-hex" to "#0a6b3d"
    And the changes are saved
    And I am on "CA" course homepage
    Then the box of the "content" activities should have "background-color" "rgb(232, 62, 140)"
    When I switch the page to dark mode
    Then the box of the "content" activities should have "background-color" "rgb(10, 107, 61)"
    When I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I set the field "Search icons" to "activity folder"
    And I wait until "[data-key='activity:folder']" "css_element" exists
    And I click on "[data-key='activity:folder']" "css_element"
    And I set the field "irs-bg-hex" to "#123456"
    And the changes are saved
    And I am on "CA" course homepage
    Then the box of the "content" activities should have "background-color" "rgb(18, 52, 86)"
    When I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I set the field "Search icons" to "activity folder"
    And I wait until "[data-key='activity:folder']" "css_element" exists
    And I click on "[data-key='activity:folder']" "css_element"
    And I press "Remove this customisation"
    And the changes are saved
    And I am on "CA" course homepage
    Then the box of the "content" activities should not have "background-color" "rgb(18, 52, 86)"

  Scenario: A look for one kind of activity wins over the look of its purpose on the pages
    Given the following "local_iconrestyle > rules" exist:
      | slot            | bg      |
      | purpose:content | #0a6b3d |
    When I reload the page
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    And I set the field "Search icons" to "activity folder"
    And I wait until "[data-key='activity:folder']" "css_element" exists
    And I click on "[data-key='activity:folder']" "css_element"
    And I set the field "irs-bg-hex" to "#e83e8c"
    And the changes are saved
    And I am on "CA" course homepage
    Then the box of the "content" activities should have "background-color" "rgb(232, 62, 140)"
