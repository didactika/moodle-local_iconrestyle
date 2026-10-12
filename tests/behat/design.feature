@local @local_iconrestyle @javascript
Feature: Design properties reach the real icons
  In order to make icons look the way the campus wants without writing CSS
  As an administrator
  I need borders, corners, spacing, size and colour to apply to Moodle's own icons

  Scenario: Border, corners and padding on one side are applied to the real icon
    Given the following "local_iconrestyle > rules" exist:
      | slot           | design                                                                    |
      | core:a/setting | {"bw":2,"bs":"dashed","bc":"#0a6b3d","radius":10,"pt":50,"scale":150}    |
    And I log in as "admin"
    When I am on site homepage
    Then the icon "core:a/setting" should have "border-top-width" "2px"
    And the icon "core:a/setting" should have "border-top-style" "dashed"
    And the icon "core:a/setting" should have "border-top-color" "rgb(10, 107, 61)"
    And the icon "core:a/setting" should have "border-top-left-radius" "10px"
    And the icon "core:a/setting" should have "padding-top" "8px"
    And the icon "core:a/setting" should have "padding-bottom" "0px"

  Scenario: Padding is set on one side only from the designer
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I click on "Spacing and size" "text" in the ".irs-panel" "css_element"
    And I click on "[data-action='toggle-link'][data-group='padding']" "css_element"
    And I set the field with xpath "//input[@data-prop='pt']" to "0.5"
    And the changes are saved
    When I am on site homepage
    Then the icon "core:a/setting" should have "padding-top" "8px"
    And the icon "core:a/setting" should have "padding-bottom" "0px"

  Scenario: Linked padding sets every side together
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I click on "Spacing and size" "text" in the ".irs-panel" "css_element"
    And I set the field with xpath "//input[@data-prop='pt']" to "0.25"
    And the changes are saved
    When I am on site homepage
    Then the icon "core:a/setting" should have "padding-top" "4px"
    And the icon "core:a/setting" should have "padding-left" "4px"
    And the icon "core:a/setting" should have "padding-bottom" "4px"

  Scenario: An image icon is recoloured with its own file, without uploading anything
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "i/agg_mean"
    And I wait until "[data-key='core:i/agg_mean']" "css_element" exists
    And I click on "[data-key='core:i/agg_mean']" "css_element"
    And I set the field "irs-fg-hex" to "#e83e8c"
    And I wait until "icon is used" "text" exists
    Then I should not see "needs artwork"
    And the changes are saved
    When I am on site homepage
    Then the image icon "core:i/agg_mean" should have "background-color" "rgb(232, 62, 140)"

  Scenario: Quick looks and the shape buttons change the look in one click
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I click on "[data-look='badge']" "css_element"
    And the changes are saved
    When I am on site homepage
    Then the icon "core:a/setting" should have "border-top-left-radius" "50%"

  Scenario: The panel only exists while an icon is open
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    Then ".irs-panel" "css_element" should not be visible
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    Then ".irs-panel" "css_element" should be visible
    When I click on "[data-action='close-panel']" "css_element"
    Then ".irs-panel" "css_element" should not be visible

  Scenario: A rule for dark mode applies only while the page is dark
    Given the following "local_iconrestyle > rules" exist:
      | slot           | fg      |
      | core:a/setting | #e83e8c |
    And the following "local_iconrestyle > rules" exist:
      | slot           | fg      | mode |
      | core:a/setting | #0a6b3d | dark |
    And I log in as "admin"
    When I am on site homepage
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"
    When I switch the page to dark mode
    Then the icon "core:a/setting" should have "color" "rgb(10, 107, 61)"
    When I switch the page to light mode
    Then the icon "core:a/setting" should have "color" "rgb(232, 62, 140)"

  Scenario: Margin, flips and filters reach the real icon
    Given the following "local_iconrestyle > rules" exist:
      | slot           | design                                                  |
      | core:a/setting | {"mt":50,"ml":-25,"flipx":1,"brightness":150,"blur":2} |
    And I log in as "admin"
    When I am on site homepage
    Then the icon "core:a/setting" should have "margin-top" "8px"
    And the icon "core:a/setting" should have "margin-left" "-4px"
    And the icon "core:a/setting" should have "transform" "matrix(-1, 0, 0, 1, 0, 0)"
    And the icon "core:a/setting" should have "filter" "brightness(1.5) blur(2px)"

  Scenario: Margin is set from the designer on its own link
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists
    When I set the field "Search icons" to "a/setting"
    And I wait until "[data-key='core:a/setting']" "css_element" exists
    And I click on "[data-key='core:a/setting']" "css_element"
    And I click on "Spacing and size" "text" in the ".irs-panel" "css_element"
    And I click on "[data-action='toggle-link'][data-group='margin']" "css_element"
    And I set the field with xpath "//input[@data-prop='mb']" to "0.5"
    And the changes are saved
    And I am on site homepage
    Then the icon "core:a/setting" should have "margin-bottom" "8px"
    And the icon "core:a/setting" should have "margin-top" "0px"
    And the icon "core:a/setting" should have "padding-bottom" "0px"
