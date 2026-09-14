import { Course } from "../types";

export const SAMPLE_SYLLABI_TEXT = [
  {
    id: "cs106a",
    title: "CS 106A: Programming Methodology & Python",
    code: "CS 106A",
    term: "Fall 2026",
    instructor: "Prof. Mehran Sahami",
    description: "An introduction to the engineering of computer applications emphasizing modern software engineering principles, control flow, functions, algorithms, data structures, and OOP in Python.",
    rawText: `CS 106A: Programming Methodology (Python)
Instructor: Prof. Mehran Sahami
Term: Fall 2026 | Lectures: Mon/Wed/Fri 10:00 - 10:50 AM

Course Overview:
Introduction to the engineering of computer applications emphasizing modern software engineering principles: object-oriented design, decomposition, encapsulation, abstraction, and testing. Emphasizes good programming style and the built-in data structures of the Python language.

Grading & Major Deadlines:
- Assignment 1 (Karel the Robot & Logic Basics): Due Friday Week 2 (10%)
- Assignment 2 (Control Flow, Loops & Functions): Due Friday Week 4 (10%)
- Midterm Exam 1 (Written + Coding): Thursday Week 5, 7:00 PM (20%)
- Assignment 3 (Strings, File I/O & Text Processing): Due Friday Week 6 (10%)
- Assignment 4 (Lists, Dictionaries & Tuples): Due Friday Week 8 (12%)
- Assignment 5 (Object-Oriented Programming & Graphics): Due Friday Week 10 (13%)
- Final Exam (Comprehensive): Monday Week 11, 8:30 AM (25%)

Weekly Schedule & Core Topics:
Week 1: Foundations of Computation & Karel
- Topic 1: Control structures, functions, and top-down step-wise refinement
- Topic 2: Python environment setup, variables, basic arithmetic types (int, float, str, bool)
Readings: Chapter 1-2, Think Python

Week 2: Control Flow & Logic
- Topic 1: Conditional logic (if / elif / else) and boolean operations (and, or, not)
- Topic 2: Definite vs indefinite loops (for-in range loops vs while loops) and loop invariants
Readings: Chapter 3-4

Week 3: Functions, Parameters & Scope
- Topic 1: Function definitions, arguments, return values, and composition
- Topic 2: Variable scoping rules (local vs global), stack frames, and call stacks
Readings: Chapter 5-6

Week 4: Data Structures: Strings & File Systems
- Topic 1: String immutability, slicing, string formatting, and common string methods
- Topic 2: File reading/writing (open, readlines, context managers 'with')
Readings: Chapter 7-8

Week 5: Midterm Review & Composite Structures: Lists
- Topic 1: List indexing, mutation, list comprehensions, and nested lists
- Topic 2: Linear search vs Binary search algorithms and Big-O efficiency basics
Readings: Chapter 9

Week 6: Key-Value Mappings: Dictionaries & Sets
- Topic 1: Hash tables intuition, dictionary keys, values, and lookup performance O(1)
- Topic 2: Frequency analysis and nested dictionaries
Readings: Chapter 10-11

Week 7: Sorting & Algorithms
- Topic 1: Selection sort vs Insertion sort vs Python's Timsort
- Topic 2: Algorithmic complexity and space-time tradeoffs
Readings: Chapter 12

Week 8: Object-Oriented Programming (OOP)
- Topic 1: Classes, instances, __init__ constructor, instance attributes, and methods
- Topic 2: Encapsulation, abstraction, and class inheritance
Readings: Chapter 13-14

Week 9: Recursion & Advanced Problem Solving
- Topic 1: Base cases vs recursive cases, recursion tree visualization
- Topic 2: Divide and conquer problem decomposition
Readings: Chapter 15

Week 10: Final Project Showcase & Course Synthesis
- Topic 1: Software architecture, debugging practices, and writing clean test suites
- Topic 2: Final exam comprehensive review and competitive practice problems
Readings: Review Notes`
  },
  {
    id: "chem201",
    title: "CHEM 201: Organic Chemistry I",
    code: "CHEM 201",
    term: "Fall 2026",
    instructor: "Dr. Elena Rostova",
    description: "Structure, bonding, stereochemistry, and reaction mechanisms of organic compounds with focus on nucleophiles, electrophiles, SN1/SN2/E1/E2, and carbonyl chemistry.",
    rawText: `CHEM 201: Organic Chemistry I
Instructor: Dr. Elena Rostova
Term: Fall 2026

Course Overview:
An in-depth journey through molecular orbital theory, resonance, conformational analysis, stereochemistry, and reaction mechanisms including nucleophilic substitution, elimination, and alkene/alkyne additions.

Grading & Deadlines:
- Problem Set 1 (Lewis structures, formal charges, resonance): Due Friday Week 2
- Problem Set 2 (Conformations of cyclohexanes & A-values): Due Friday Week 4
- Midterm 1 (Structure, Resonance, Acids/Bases & Stereochem): Thursday Week 5
- Problem Set 3 (SN1, SN2, E1, E2 competition): Due Friday Week 7
- Midterm 2 (Reactions of Alkenes, Alkynes, and Alcohols): Thursday Week 8
- Final Examination: Comprehensive ACS standard, Dec 12

Weekly Topics:
Week 1: Atomic Orbitals, Hybridization, and Resonance
- Topic 1: sp3, sp2, sp hybrid orbitals and bond geometry
- Topic 2: Drawing valid resonance contributors and major/minor contributor rules

Week 2: Acid-Base Chemistry in Organic Context
- Topic 1: pKa trends, elemental effects, inductive effects, resonance stabilization, hybridization
- Topic 2: Predicting equilibrium positions in organic acid-base reactions

Week 3: Alkanes & Conformational Analysis
- Topic 1: Newman projections, torsional vs steric strain, eclipsed vs staggered conformations
- Topic 2: Cyclohexane chair flips, axial vs equatorial positions, and 1,3-diaxial interactions

Week 4: Stereochemistry & Chirality
- Topic 1: Chiral centers, R/S Cahn-Ingold-Prelog nomenclature
- Topic 2: Enantiomers vs diastereomers vs meso compounds, optical activity

Week 5: Alkyl Halides & Nucleophilic Substitution (SN1 vs SN2)
- Topic 1: SN2 mechanism: backside attack, inversion of stereochemistry, substrate sterics
- Topic 2: SN1 mechanism: carbocation intermediates, racemization, solvolysis

Week 6: Elimination Reactions (E1 vs E2) & Reaction Competition
- Topic 1: E2 anti-periplanar geometry, Zaitsev vs Hofmann product selectivity
- Topic 2: Decision matrix for predicting SN1/SN2/E1/E2 based on substrate, base/nucleophile, and solvent

Week 7: Electrophilic Addition to Alkenes
- Topic 1: Markovnikov addition, hydrohalogenation, hydration
- Topic 2: Halogenation, halohydrin formation, anti-addition stereospecificity

Week 8: Alkynes & Organic Synthesis Strategies
- Topic 1: Acidity of terminal alkynes, acetylide anion alkylation
- Topic 2: Retrosynthetic analysis: working backwards from target molecules`
  }
];

export const INITIAL_PRESET_COURSE: Course = {
  id: "course-cs106a",
  name: "Programming Methodology & Python",
  code: "CS 106A",
  instructor: "Prof. Mehran Sahami",
  term: "Fall 2026",
  description: "Introduction to software engineering principles, control flow, functions, algorithms, data structures, and OOP in Python.",
  createdAt: new Date().toISOString(),
  suggestedStudyOrderExplanation: "Focus on mastering Karel and Functions in Weeks 1-3 first; these form the computational mental model you will need for Midterm 1 and tricky nested data structures in Weeks 5-6.",
  modules: [
    {
      id: "mod-1",
      title: "Module 1: Foundations & Python Basics",
      weekNumber: 1,
      orderIndex: 1,
      description: "Computational thinking, decomposition, variables, and primitive types.",
      topics: [
        {
          id: "top-1-1",
          title: "Computational Thinking & Decomposition",
          summary: "Breaking down complex problems into clean, testable sub-functions using top-down refinement.",
          difficulty: "Beginner",
          estimatedMinutes: 30,
          keyTerms: ["Decomposition", "Abstraction", "Top-Down Design", "Step-wise Refinement"],
          readingsOrRefs: ["Think Python Ch. 1"],
          isCompleted: true,
        },
        {
          id: "top-1-2",
          title: "Variables, Types & Expressions",
          summary: "Understanding integers, floats, strings, booleans, type casting, and operator precedence.",
          difficulty: "Beginner",
          estimatedMinutes: 40,
          keyTerms: ["int/float", "Dynamic Typing", "Operator Precedence", "Type Coercion"],
          readingsOrRefs: ["Think Python Ch. 2"],
          isCompleted: true,
        }
      ]
    },
    {
      id: "mod-2",
      title: "Module 2: Control Flow & Logic",
      weekNumber: 2,
      orderIndex: 2,
      description: "Mastering conditional branching and loop invariants.",
      topics: [
        {
          id: "top-2-1",
          title: "Conditionals & Boolean Logic",
          summary: "Branching execution paths using if/elif/else and truth tables (and, or, not, short-circuit evaluation).",
          difficulty: "Beginner",
          estimatedMinutes: 45,
          keyTerms: ["Short-Circuiting", "Boolean Expressions", "elif Branching", "Truth Tables"],
          readingsOrRefs: ["Think Python Ch. 3"],
          isCompleted: false,
        },
        {
          id: "top-2-2",
          title: "Loops (for-range vs while) & Invariants",
          summary: "Definite iteration with for-loops and indefinite sentinel-controlled iteration with while-loops.",
          difficulty: "Intermediate",
          estimatedMinutes: 50,
          keyTerms: ["Loop Invariant", "Off-by-one Error", "Sentinel Value", "Break/Continue"],
          readingsOrRefs: ["Think Python Ch. 4"],
          isCompleted: false,
        }
      ]
    },
    {
      id: "mod-3",
      title: "Module 3: Functions, Scope & Call Stack",
      weekNumber: 3,
      orderIndex: 3,
      description: "How Python manages parameters, return values, namespaces, and the runtime stack.",
      topics: [
        {
          id: "top-3-1",
          title: "Function Signatures & Return Values",
          summary: "Pure functions, side effects, default arguments, and multi-value returns.",
          difficulty: "Beginner",
          estimatedMinutes: 40,
          keyTerms: ["Pure Function", "Side Effect", "Tuple Unpacking", "Docstrings"],
          readingsOrRefs: ["Think Python Ch. 5"],
          isCompleted: false,
        },
        {
          id: "top-3-2",
          title: "Variable Scope & The Call Stack",
          summary: "Local vs global namespaces, pass-by-object-reference, and visualizing stack frames.",
          difficulty: "Intermediate",
          estimatedMinutes: 60,
          keyTerms: ["Stack Frame", "Call Stack", "Namespace", "LEGB Scope Rule"],
          readingsOrRefs: ["Think Python Ch. 6"],
          isCompleted: false,
        }
      ]
    },
    {
      id: "mod-4",
      title: "Module 4: Data Structures & Hash Maps",
      weekNumber: 5,
      orderIndex: 4,
      description: "Lists, strings, dictionaries, tuples, and algorithmic efficiency.",
      topics: [
        {
          id: "top-4-1",
          title: "Lists & List Comprehensions",
          summary: "Mutable sequence manipulation, slicing, in-place vs return methods, and idiomatic comprehensions.",
          difficulty: "Intermediate",
          estimatedMinutes: 55,
          keyTerms: ["Mutability", "List Slicing", "List Comprehension", "Shallow vs Deep Copy"],
          readingsOrRefs: ["Think Python Ch. 9"],
          isCompleted: false,
        },
        {
          id: "top-4-2",
          title: "Dictionaries & Hash Map Mechanics",
          summary: "Key-value mappings, O(1) average lookup time, hashing requirements, and frequency counting.",
          difficulty: "Advanced",
          estimatedMinutes: 65,
          keyTerms: ["Hash Table", "Hashable Keys", "O(1) Lookup", "Collision Resolution"],
          readingsOrRefs: ["Think Python Ch. 10"],
          isCompleted: false,
        }
      ]
    }
  ],
  deadlines: [
    {
      id: "dl-1",
      title: "Assignment 1: Karel & Decomposition",
      type: "assignment",
      dueDate: "Friday, Week 2",
      weightPercent: 10,
      description: "Implement clean Karel navigation algorithms with zero redundant code.",
      isCompleted: true,
      relatedTopicTitle: "Computational Thinking & Decomposition"
    },
    {
      id: "dl-2",
      title: "Assignment 2: Control Flow & Loops",
      type: "assignment",
      dueDate: "Friday, Week 4",
      weightPercent: 10,
      description: "Write game loops, input validation, and ASCII graphics algorithms.",
      isCompleted: false,
      relatedTopicTitle: "Loops (for-range vs while)"
    },
    {
      id: "dl-3",
      title: "Midterm Exam (Written + Coding)",
      type: "exam",
      dueDate: "Thursday, Week 5 (7:00 PM)",
      weightPercent: 20,
      description: "Covers Karel through Lists & Functions. Strict time limit.",
      isCompleted: false,
      relatedTopicTitle: "Module 1-3 Comprehensive"
    },
    {
      id: "dl-4",
      title: "Assignment 3: Dictionaries & Text Analysis",
      type: "assignment",
      dueDate: "Friday, Week 7",
      weightPercent: 12,
      description: "Word count frequency analysis on multi-megabyte datasets.",
      isCompleted: false,
      relatedTopicTitle: "Dictionaries & Hash Map Mechanics"
    }
  ]
};
