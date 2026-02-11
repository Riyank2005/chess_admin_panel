import React, { useEffect, useState } from "react";
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Shield,
    Gamepad2,
    Trophy,
    History,
    Terminal,
    LogOut,
    Search,
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-black/20 hover:bg-black/40 transition-all border-white/5 text-white/40 hover:text-white/60 text-[10px] font-black uppercase tracking-widest"
            >
                <Search className="h-3 w-3" />
                <span>Search Commands</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-2">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList className="scrollbar-none">
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                        <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
                            <Terminal className="mr-2 h-4 w-4 text-cyan-400" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/users"))}>
                            <User className="mr-2 h-4 w-4 text-blue-400" />
                            <span>Tactical Operators</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/reports"))}>
                            <Shield className="mr-2 h-4 w-4 text-rose-400" />
                            <span>Security Reports</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
                            <Settings className="mr-2 h-4 w-4 text-emerald-400" />
                            <span>System Settings</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Game Management">
                        <CommandItem onSelect={() => runCommand(() => navigate("/games"))}>
                            <Gamepad2 className="mr-2 h-4 w-4 text-purple-400" />
                            <span>Active Conflicts</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/tournaments"))}>
                            <Trophy className="mr-2 h-4 w-4 text-amber-400" />
                            <span>Tournaments</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="System">
                        <CommandItem onSelect={() => runCommand(() => navigate("/audit"))}>
                            <History className="mr-2 h-4 w-4 text-white/40" />
                            <span>Audit logs</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(logout)}>
                            <LogOut className="mr-2 h-4 w-4 text-rose-500" />
                            <span>Terminate Session</span>
                            <CommandShortcut>⇧⌘Q</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
