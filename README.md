# Q-LEOGuard

Hybrid Quantum-Classical Framework for Satellite Collision Avoidance and Orbital Traffic Optimization

---

# What is Q-LEOGuard?

Q-LEOGuard is a research-oriented orbital intelligence platform being developed by the Quantum Computing Club.

The project aims to combine orbital mechanics, optimization theory, quantum computing, and interactive visualization into a unified framework capable of:

* Simulating realistic satellite motion
* Detecting dangerous conjunction (collision-risk) events
* Generating orbital maneuver optimization problems
* Applying classical and quantum optimization methods
* Benchmarking optimization performance
* Visualizing orbital traffic behavior through interactive 3D systems

The objective is not to claim quantum advantage, but to explore how hybrid quantum-classical optimization approaches may contribute to future orbital traffic management systems.

---

# Architecture Overview

Long-Term System Pipeline

```text
TLE Data
   ↓
Orbital Propagation
   ↓
Satellite State Generation
   ↓
Conjunction Detection
   ↓
Optimization Modeling
   ↓
QUBO Generation
   ↓
Classical Solver / QAOA
   ↓
Maneuver Recommendation
   ↓
3D Visualization & Benchmarking
```

Current development focuses on building a strong orbital simulation foundation before introducing optimization and quantum workflows.

---

# Repository Structure

```text
src/
├── assets/                    # Static project assets
│   ├── models/                # Future 3D models
│   ├── shaders/               # Custom rendering shaders
│   └── textures/              # Earth, space, and satellite textures
│
├── components/                # Reusable application-wide UI components
│   ├── layout/                # Layout wrappers and structural UI
│   └── ui/                    # Generic reusable UI elements
│
├── config/                    # Global configuration files
│   ├── constants.ts           # Application-wide constants
│   └── simConfig.ts           # Simulation parameters and settings
│
├── core/                      # Scientific and mathematical backbone
│   ├── conjunction/           # Future collision-risk detection systems
│   ├── math/
│   │   └── vector.ts          # Vector operations used across simulation
│   │
│   ├── optimization/          # Future optimization and QUBO systems
│   │
│   └── physics/
│       ├── propagator.ts      # Orbital propagation logic
│       │
│       └── forces/
│           ├── ForceModel.ts  # Base interface for all force models
│           └── GravityForce.ts# Earth gravity implementation
│
├── data/                      # Satellite datasets and future TLE sources
│
├── features/                  # Feature-based application modules
│   ├── catalog/               # Future satellite catalog management
│   ├── optimization/          # Future optimization dashboards
│   ├── research/              # Research visualizations and analytics
│   │
│   └── visualization/         # Main 3D orbital visualization system
│       ├── components/
│       │   ├── Earth.tsx      # Earth rendering component
│       │   ├── OrbitPaths.tsx # Orbit trajectory rendering
│       │   └── Satellites.tsx # Satellite rendering
│       │
│       ├── hooks/             # Visualization-specific React hooks
│       │
│       ├── overlays/
│       │   ├── Topbar.tsx     # Top telemetry/status bar
│       │   ├── Bottombar.tsx  # Bottom information panel
│       │   ├── SideRail.tsx   # Quick-access controls
│       │   ├── SideDrawer.tsx # Expandable information drawer
│       │   └── PlatformUI.tsx # Main visualization UI composition
│       │
│       └── scene/
│           └── OrbitalCanvas.tsx
│                              # Three.js / React Three Fiber scene setup
│
├── hooks/                     # Shared application hooks
│
├── models/
│   └── satellite.ts           # Satellite and orbital state models
│
├── simulation/
│   ├── SimulationEngine.ts    # Central simulation coordinator
│   ├── SimulationState.ts     # Stores simulation state
│   └── TimeController.ts      # Controls simulation time progression
│
├── styles/
│   └── globals.css            # Global styling
│
└── utils/                     # General helper functions
```

---

# Folder Responsibilities

### core/

Contains the scientific engine of Q-LEOGuard. All orbital mechanics, physics, conjunction detection, optimization logic, and future quantum workflows ultimately belong here.

### simulation/

Coordinates and executes simulation workflows using systems provided by the core layer.

### models/

Defines shared data structures used throughout the platform.

### features/

Contains user-facing modules such as visualization, optimization dashboards, research tools, and future catalog systems.

### components/

Reusable UI elements shared across multiple features.

### data/

Stores satellite datasets, TLE files, scenario data, and future external data sources.

### docs/

Contains architecture notes, research findings, meeting summaries, technical decisions, and project planning documents.

---

# Current Development Status

## Completed

* Project architecture finalized
* Repository structure established
* Vector mathematics library implemented
* Satellite and orbital state models implemented
* Force model abstraction implemented
* Gravity force implementation completed
* Propagation framework implemented
* Simulation engine framework implemented
* Time controller framework implemented
* Initial orbital visualization completed
* Initial platform UI and telemetry panels completed

## Currently In Progress

* Visualization refinement
* Physics validation
* Simulation accuracy improvements
* UI polishing

## Upcoming

* Real TLE ingestion
* SGP4 integration
* Conjunction detection framework
* Optimization modeling
* Constraint engineering
* QUBO generation
* QAOA workflows
* Benchmarking framework
* Research analytics systems

---

# Development Philosophy

Q-LEOGuard follows a research-first development methodology.

Features are not implemented simply because they seem interesting.

New systems are introduced only after sufficient research, validation, and architectural discussion.

The objective is to build a scientifically meaningful orbital intelligence platform rather than a collection of disconnected features.

Research findings continuously drive simulator, optimization, and visualization development.

---

# How to Run Locally

```bash
npm install
npm run dev
```

---

# Contributing Guide

### Branch Naming

```text
feature/<feature-name>
fix/<issue-name>
research/<topic-name>
```

Examples:

```text
feature/tle-loader
feature/conjunction-engine
feature/ui-refactor
research/qubo-formulation
```

### Pull Request Process

1. Create a feature branch.
2. Implement and test changes.
3. Open a pull request.
4. Wait for review before merging.

Avoid committing directly to `main`.

---

