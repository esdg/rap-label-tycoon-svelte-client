# RLT Front-End Architecture

This document outlines the structure and components of the RLT front-end application.

## 1. Page Structure

The application follows a modular page structure, organized by feature.

```
home
└── about
users
├── login
├── register
└── edit
labels
├── create
└── roster
revenues
└── overview
productions/music-catalog (releases, tracks, beats)
├── releases
│   └── detail/{id}
└── tracks
│   └── detail/{id}
artists
└── detail/{id}
```

## 2. Modal System (Task Flows)

User tasks are handled through a step-by-step modal system.

```
task
├── scout talents
│   ├── step 1: Scouting parameters form
│   └── step 2: Summary
├── sign artist contract
│   ├── step 1: Artist summary
│   ├── step 2: Previous contract offers and response summary (if not the first offer)
│   ├── step 3: Contract terms form
│   └── step 4: Summary
├── produce beats
│   ├── step 1: Artist summary and beat-making parameters form
│   └── step 2: Summary
├── produce release
│   ├── step 1: Artist summary and release parameters form
│   └── step 2: Summary
├── publish release
│   ├── step 1: Release summary and publishing parameters form
│   └── step 2: Summary
└── claim task
    ├── step 1: Claim
    └── step 2: Results
```

## 3. Component Specifications

The list of all components to create, with specification.

### Form Components

#### button

##### inputs

- `color`: The background color of the button.
- `style`: The button style (`normal` or `hollow`).
- `text`: The text displayed on the button.
- `altText`: The alternative text for accessibility.

##### output

- `clicked`: Event emitted when the button is clicked.

#### numeric input field

##### inputs

- `initialValue`: The initial numeric value.
- `labelText`: The text for the input's label.

##### output

- `currentValue`: The current numeric value from the input.

### UI Components

#### stepper

##### inputs

- `numberOfSteps`: The total number of steps.
- `activeStepIndex`: The index of the currently active step.
- `buttonColor`: The color of the step buttons.
- `textColor`: The color of the step text.
- `stepLabels`: An array of text labels for each step.

##### output

- `stepClicked`: Event emitted with the index of the clicked step.
