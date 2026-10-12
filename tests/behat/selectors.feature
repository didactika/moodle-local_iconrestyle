@local @local_iconrestyle @javascript
Feature: Every page and region a rule can be limited to exists in the theme
  In order to trust the places offered by the designer
  As a site manager
  I need each page and region selector to match real markup

  Background:
    Given the following "courses" exist:
      | fullname | shortname |
      | Course A | CA        |
    And the following "activities" exist:
      | activity | name  | course | idnumber |
      | assign   | Essay | CA     | ESSAY    |
    And I log in as "admin"

  Scenario: Pages
    When I visit the path "/my/"
    Then "body#page-my-index" "css_element" should exist
    When I visit the path "/admin/search.php"
    Then "body.path-admin" "css_element" should exist
    When I visit the path "/user/profile.php"
    Then "body.path-user" "css_element" should exist
    When I visit the path "/calendar/view.php?view=month"
    Then "body.path-calendar" "css_element" should exist
    When I am on "CA" course homepage
    Then "body.path-course-view" "css_element" should exist
    When I am on the "Essay" "assign activity" page
    Then "body.path-mod" "css_element" should exist
    When I visit the path "/grade/report/overview/index.php"
    Then "body.path-grade" "css_element" should exist

  Scenario: Regions of a course page
    Given the following "blocks" exist:
      | blockname        | contextlevel | reference | pagetypepattern | defaultregion |
      | calendar_month   | Course       | CA        | course-view-*   | side-pre      |
    When I am on "CA" course homepage
    Then ".navbar" "css_element" should exist
    And ".primary-navigation" "css_element" should exist
    And ".secondary-navigation" "css_element" should exist
    And "#courseindex" "css_element" should exist
    And ".block-region" "css_element" should exist
    And "#region-main" "css_element" should exist
    And "#page-footer" "css_element" should exist

  Scenario: The login page
    Given I log out
    When I visit the path "/login/index.php"
    Then "body#page-login-index" "css_element" should exist
