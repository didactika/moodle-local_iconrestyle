@local @local_iconrestyle @javascript
Feature: The designer stays fast with a catalogue of hundreds of icons
  In order to keep the designer usable on any site
  As an administrator
  I need the grid to draw only what is in view and to keep up with scrolling

  Background:
    Given I log in as "admin"
    And I navigate to "Appearance > Icon Restyle > Icon designer" in site administration
    And I wait until "[data-region='grid-window'] .irs-card" "css_element" exists

  Scenario: The first grid appears quickly and holds only the cards in view
    Then the designer lists at least "800" icons
    And the designer drew its first grid within "6000" milliseconds
    And the grid holds at most "250" cards

  Scenario: Scrolling through the whole catalogue keeps up and never holds more cards than fit
    When I scroll the icon grid through the whole catalogue
    Then scrolling took at most "15000" milliseconds and no frame took more than "1500"
    And the grid holds at most "250" cards
