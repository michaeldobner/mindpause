# Levels

[Deutsche Version](../de/stufen.md) · [Overview](README.md)

## The problem

In Klondike the shuffle decides everything. Some deals almost solve themselves, others demand careful planning, and roughly one in five cannot be won at all, however well you play. A "Hard" level based only on stricter rules would not change that.

## The solution: chosen instead of random deals

Every game has a **deal number**. The same number gives the same deal on every device (a seeded random generator, like the FreeCell deal numbers on Windows). KARO sorts numbers into levels **in advance on a computer** and ships only the finished lists.

For every number and draw mode:

1. **A simple player** (`tools/player.mjs`) plays it 24 times. It only sees what a person sees, does not plan ahead and always makes the obvious move, with a little randomness. Its **win rate** shows how obvious the path is. If it wins even once, the deal can certainly be solved.
2. If it never wins, the **solver** (`js/solver.js`) searches for a path knowing every card. The number of positions it needs shows **how narrow** the path is.

| Level | Condition |
|---|---|
| Easy | win rate of 50 % or more |
| Medium | win rate 10 to 50 % |
| Hard | win rate below 10 %, or 0 % and the solver finds the path quickly |
| Masterful | win rate 0 % and the solver needs a long time |

Deals for which the solver finds no path go into no list. There are 200 deals per level and draw mode.

## Which number comes next

Each device starts at a random point in the list and then goes through it in order, so nothing repeats for a long time. The **daily deal** picks from the "Medium" list by date, the same for everyone. **Random** takes any number without a check.

## Regenerating the lists

```bash
node karo/tools/deals.mjs 200    # 200 deals per level, takes a few minutes
```

The script writes `karo/js/deals.js`. Then raise the version so devices load the new list.
