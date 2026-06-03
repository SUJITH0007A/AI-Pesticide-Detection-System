---
name: FreshScan
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#3d4943'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#6d7a73'
  outline-variant: '#bccac1'
  surface-tint: '#006c4e'
  primary: '#00694c'
  on-primary: '#ffffff'
  primary-container: '#008560'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dbae'
  secondary: '#885200'
  on-secondary: '#ffffff'
  secondary-container: '#fdad4e'
  on-secondary-container: '#704200'
  tertiary: '#af262a'
  on-tertiary: '#ffffff'
  tertiary-container: '#d23f40'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#86f8c9'
  primary-fixed-dim: '#68dbae'
  on-primary-fixed: '#002115'
  on-primary-fixed-variant: '#00513a'
  secondary-fixed: '#ffdcbb'
  secondary-fixed-dim: '#ffb869'
  on-secondary-fixed: '#2b1700'
  on-secondary-fixed-variant: '#673d00'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ae'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#900a18'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 16px
  gutter: 12px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style
The design system is built on the principles of **Modern Minimalism** and **Functional Clarity**. Designed for health-conscious consumers, the aesthetic prioritizes trust and immediate legibility. The interface acts as a transparent lens, using a clinical yet approachable "Lab-to-Table" style that balances professional AI-driven data with the organic nature of food. 

The visual language emphasizes high-quality whitespace to reduce cognitive load during the scanning process. Information is structured to provide an instant emotional response through color—safety, caution, or alert—while maintaining a professional, non-alarmist tone.

## Colors
The color palette is strictly semantic, designed to communicate food safety status at a glance:

*   **Primary (Organic/Safe):** A sophisticated teal-green used for positive scan results and primary actions. It evokes health and natural growth.
*   **Secondary (Possibly Treated):** An amber tone used for cautionary data points where pesticide or chemical presence is indeterminate or low-level.
*   **Tertiary (High Risk):** A muted red for high-confidence chemical detection.
*   **Neutral & Surface:** The background uses a crisp off-white (#F8F9FA) to separate from pure white surface cards. Borders use a subtle grey (#E9ECEF) to define structure without adding visual noise.

## Typography
This design system utilizes **Inter** for all applications to ensure maximum readability and a systematic, utilitarian feel. 

*   **Headings:** Set at 500 weight to maintain a professional appearance that isn't overly aggressive. Headlines use slight negative letter-spacing to appear tighter on mobile screens.
*   **Body Text:** Optimized for long-form nutritional data and chemical breakdowns, emphasizing line height for better eye tracking.
*   **Labels:** Small-caps or uppercase labels are used for technical data points (e.g., "CHEMICAL PPM") to distinguish them from descriptive text.

## Layout & Spacing
This design system employs a **mobile-first fluid grid** with a focus on vertical rhythm. 

*   **Grid:** A 4-column layout for mobile devices with 16px outer margins and 12px gutters.
*   **Rhythm:** Spacing is strictly based on an 8px scale. Use 4px for tight groupings (like icons next to text) and 24px+ for separating major content sections.
*   **Touch Targets:** All interactive elements maintain a minimum 44x44px hit area, regardless of their visual size.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Soft Ambient Shadows** rather than heavy gradients.

*   **Surface:** Use white (#FFFFFF) for the primary content cards.
*   **Shadows:** Apply a singular, very soft shadow style to active cards: `0px 4px 12px rgba(0, 0, 0, 0.04)`.
*   **Borders:** All surface cards must feature a 1px solid border in `#E9ECEF`. This provides definition even in high-glare environments (e.g., scanning produce in a bright grocery store).
*   **Active State:** When an item is tapped, the shadow increases slightly in spread, and the border color shifts to the primary teal-green.

## Shapes
The shape language balances modern software aesthetics with organic approachability.

*   **Standard Radius:** 8px (0.5rem) for primary cards and input fields.
*   **Large Radius:** 16px (1rem) for bottom sheets and featured scan result headers.
*   **Pills:** Buttons and status chips use fully rounded (pill) corners to differentiate them from informational containers.

## Components
Consistent implementation of these core components ensures the design system remains cohesive:

*   **Result Cards:** Large white containers with a colored top-border (2px) indicating the scan status (Safe/Treated/Risk).
*   **Action Buttons:** Primary buttons are solid teal-green with white text. Secondary buttons use an outline style with the primary color for the border and text.
*   **Status Chips:** Small, pill-shaped indicators with light-tinted backgrounds (10% opacity of the status color) and dark-tinted text for maximum contrast and accessibility.
*   **Input Fields:** Minimalist outlines with Inter Body-md text. Active focus states use a 2px teal-green border.
*   **Scanning HUD:** A specialized component featuring a large, rounded-corner viewfinder with outline-style icons from the Tabler/Heroicons library to guide the user.
*   **Icons:** Use 2px stroke-width outline icons. Never use filled icons unless they represent a toggle-on state.