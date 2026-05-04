
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AccountProvider } from "./context/AccountContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AccountCreated from "./pages/AccountCreated";
import ATM from "./pages/ATM";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import FastCash from "./pages/FastCash";
import MiniStatement from "./pages/MiniStatement";
import PinChange from "./pages/PinChange";
import BalanceEnquiry from "./pages/BalanceEnquiry";
import InterestCalculator from "./pages/InterestCalculator";
import Database from "./pages/Database";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AccountProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/account-created" element={<AccountCreated />} />
            <Route path="/atm" element={<ATM />} />
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/fast-cash" element={<FastCash />} />
            <Route path="/mini-statement" element={<MiniStatement />} />
            <Route path="/pin-change" element={<PinChange />} />
            <Route path="/balance-enquiry" element={<BalanceEnquiry />} />
            <Route path="/interest-calculator" element={<InterestCalculator />} />
            <Route path="/database" element={<Database />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AccountProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
