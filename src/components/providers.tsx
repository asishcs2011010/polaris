"use client";

import { ClerkProvider, SignInButton, useAuth, UserButton } from "@clerk/nextjs";
import { ConvexReactClient, Unauthenticated, Authenticated, AuthLoading } from "convex/react";
import {ConvexProviderWithClerk} from "convex/react-clerk";


import { ThemeProvider } from "@/components/theme-provider";


import { UnauthenticatedView } from "@/features/auth/components/unauthenticated-view";
import { User } from "lucide-react";
import { AuthLoadingView } from "@/features/auth/components/auth-loading-view";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const Providers = ({children}: {children: React.ReactNode}) =>{
 return (
    <ClerkProvider>
        <ConvexProviderWithClerk client = {convex} useAuth={useAuth}>
             <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                    >
                    <Authenticated>
                         <div className="flex justify-end p-4">
                            <UserButton/>
                        </div>
                        {children}   
                    </Authenticated>
                    <Unauthenticated>
                     <UnauthenticatedView/>
                    </Unauthenticated>
                    <AuthLoading>
                        <AuthLoadingView/>
                    </AuthLoading>
            </ThemeProvider>
        </ConvexProviderWithClerk>
    </ClerkProvider>
 );
};

