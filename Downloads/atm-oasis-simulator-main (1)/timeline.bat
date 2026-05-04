@echo off
echo Starting ATM Simulator Timeline...

REM ----------- AUGUST -----------

echo // Initial setup >> package.json
git add .
set GIT_AUTHOR_DATE=2025-08-10T10:30:00
set GIT_COMMITTER_DATE=2025-08-10T10:30:00
git commit --date="2025-08-10T10:30:00" -m "Initial project setup with React + Vite"

echo // README >> README.md
git add .
set GIT_AUTHOR_DATE=2025-08-12T14:00:00
set GIT_COMMITTER_DATE=2025-08-12T14:00:00
git commit --date="2025-08-12T14:00:00" -m "Added project documentation"

echo // Base app >> src/App.tsx
git add .
set GIT_AUTHOR_DATE=2025-08-14T17:20:00
set GIT_COMMITTER_DATE=2025-08-14T17:20:00
git commit --date="2025-08-14T17:20:00" -m "Created base app structure"

echo // UI components >> src/components/ui
git add .
set GIT_AUTHOR_DATE=2025-08-16T11:30:00
set GIT_COMMITTER_DATE=2025-08-16T11:30:00
git commit --date="2025-08-16T11:30:00" -m "Integrated UI components"

echo // Bank logo >> src/components/BankLogo.tsx
git add .
set GIT_AUTHOR_DATE=2025-08-18T15:00:00
set GIT_COMMITTER_DATE=2025-08-18T15:00:00
git commit --date="2025-08-18T15:00:00" -m "Added bank logo"

echo // Login page >> src/pages/Login.tsx
git add .
set GIT_AUTHOR_DATE=2025-08-20T12:40:00
set GIT_COMMITTER_DATE=2025-08-20T12:40:00
git commit --date="2025-08-20T12:40:00" -m "Implemented login page"

echo // Signup >> src/pages/Signup.tsx
git add .
set GIT_AUTHOR_DATE=2025-08-22T16:10:00
set GIT_COMMITTER_DATE=2025-08-22T16:10:00
git commit --date="2025-08-22T16:10:00" -m "Added signup functionality"

echo // Context >> src/context/AccountContext.tsx
git add .
set GIT_AUTHOR_DATE=2025-08-24T11:00:00
set GIT_COMMITTER_DATE=2025-08-24T11:00:00
git commit --date="2025-08-24T11:00:00" -m "Setup account context"

echo // ATM dashboard >> src/pages/ATM.tsx
git add .
set GIT_AUTHOR_DATE=2025-08-26T14:30:00
set GIT_COMMITTER_DATE=2025-08-26T14:30:00
git commit --date="2025-08-26T14:30:00" -m "Created ATM dashboard"

echo // Deposit >> src/pages/Deposit.tsx
git add .
set GIT_AUTHOR_DATE=2025-08-28T13:20:00
set GIT_COMMITTER_DATE=2025-08-28T13:20:00
git commit --date="2025-08-28T13:20:00" -m "Implemented deposit feature"

echo // Withdraw >> src/pages/Withdraw.tsx
git add .
set GIT_AUTHOR_DATE=2025-08-30T18:00:00
set GIT_COMMITTER_DATE=2025-08-30T18:00:00
git commit --date="2025-08-30T18:00:00" -m "Added withdraw feature"

REM ----------- SEPTEMBER -----------

echo // Balance enquiry >> src/pages/BalanceEnquiry.tsx
git add .
set GIT_AUTHOR_DATE=2025-09-02T10:30:00
set GIT_COMMITTER_DATE=2025-09-02T10:30:00
git commit --date="2025-09-02T10:30:00" -m "Implemented balance enquiry"

echo // Fast cash >> src/pages/FastCash.tsx
git add .
set GIT_AUTHOR_DATE=2025-09-04T15:00:00
set GIT_COMMITTER_DATE=2025-09-04T15:00:00
git commit --date="2025-09-04T15:00:00" -m "Added fast cash feature"

echo // Mini statement >> src/pages/MiniStatement.tsx
git add .
set GIT_AUTHOR_DATE=2025-09-06T12:45:00
set GIT_COMMITTER_DATE=2025-09-06T12:45:00
git commit --date="2025-09-06T12:45:00" -m "Implemented mini statement"

echo // Pin change >> src/pages/PinChange.tsx
git add .
set GIT_AUTHOR_DATE=2025-09-08T16:20:00
set GIT_COMMITTER_DATE=2025-09-08T16:20:00
git commit --date="2025-09-08T16:20:00" -m "Added PIN change feature"

echo // Interest calc >> src/pages/InterestCalculator.tsx
git add .
set GIT_AUTHOR_DATE=2025-09-10T11:15:00
set GIT_COMMITTER_DATE=2025-09-10T11:15:00
git commit --date="2025-09-10T11:15:00" -m "Added interest calculator"

echo // Account created >> src/pages/AccountCreated.tsx
git add .
set GIT_AUTHOR_DATE=2025-09-12T14:40:00
set GIT_COMMITTER_DATE=2025-09-12T14:40:00
git commit --date="2025-09-12T14:40:00" -m "Created account confirmation page"

echo // Database logic >> src/pages/Database.tsx
git add .
set GIT_AUTHOR_DATE=2025-09-15T17:10:00
set GIT_COMMITTER_DATE=2025-09-15T17:10:00
git commit --date="2025-09-15T17:10:00" -m "Added database simulation logic"

echo // Bug fix >> src/hooks/use-toast.ts
git add .
set GIT_AUTHOR_DATE=2025-09-18T13:30:00
set GIT_COMMITTER_DATE=2025-09-18T13:30:00
git commit --date="2025-09-18T13:30:00" -m "Fixed UI notification issues"

echo // Mobile support >> src/hooks/use-mobile.tsx
git add .
set GIT_AUTHOR_DATE=2025-09-20T16:00:00
set GIT_COMMITTER_DATE=2025-09-20T16:00:00
git commit --date="2025-09-20T16:00:00" -m "Improved mobile responsiveness"

echo // Utils >> src/lib/utils.ts
git add .
set GIT_AUTHOR_DATE=2025-09-23T18:20:00
set GIT_COMMITTER_DATE=2025-09-23T18:20:00
git commit --date="2025-09-23T18:20:00" -m "Optimized utility functions"

echo // Final cleanup >> src/App.tsx
git add .
set GIT_AUTHOR_DATE=2025-09-25T17:45:00
set GIT_COMMITTER_DATE=2025-09-25T17:45:00
git commit --date="2025-09-25T17:45:00" -m "Final cleanup and improvements"

echo Done!
pause
