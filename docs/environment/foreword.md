# Foreword

[← Back](../doc.md?id=ref-foreword)

## Project Philosophy

SkoreFlow is an open-source platform, dedicated to the processing and management of sheet music.

Starting from a simple upload, the application transforms documents into structured musical data through a modern REST - **_(REpresentational State Transfer)_** architecture designed for scalability, maintainability, and future extensions.

While the original inspiration came also from [SheetAble](https://github.com/SheetAble/SheetAble) project, SkoreFlow has its own architecture, implementation, development workflow, and feature set.

It stands as an **independent project focused on clean architecture, extensibility, and modern software engineering practices**.

## What about AI in all of this?

### IA Philosophy

At a time when artificial intelligence is transforming software development, it is essential to clarify the role it plays within the **SkoreFlow** project.

In this project Artificial Intelligence has been used as an **assistance tool** and a strong productivity booster, but in no way a substitute for human critical thinking or technical expertise.

During the development of SkoreFlow, AI has been used to:

- **Explore new avenues:** identify alternative software approaches or patterns we might not have initially considered.
- **Refine the codebase:** assist in correcting and refactoring complex code sections.
- **Streamline repetitive tasks:** accelerate the generation of unit tests (specifically with Vitest).

However, **a fundamental rule governs the use of AI in SkoreFlow: no generated code is integrated without being fully understood, audited, and mastered 100%.**

Every suggestion provided by AI is approached with a critical, skeptical eye focused strictly on the application's precise goals. Code is systematically adapted, rewritten, and aligned with our architectural standards.

### Why this level of rigor?

Admittedly, modern AI could generate a substantial portion of an entire application in a few prompts. However, doing so would come at the expense of structural consistency, architectural integrity, and the project's core concept.

Software must be designed for the long term. Tomorrow, through official releases and future updates, it is unacceptable to deliver a breaking version simply because an AI decided to completely overhaul the underlying approach.

**SkoreFlow is built to last.** A living codebase evolves, receives new features, and inevitably encounters and fixes bugs over time. Long-term maintainability, system stability, and overall reliability are only possible when the developer maintains **complete and absolute ownership of the codebase**.
