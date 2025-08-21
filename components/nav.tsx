'use client';

import * as React from 'react';
import { UserButton } from "@clerk/nextjs";
import { FileText } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

const NavBar: React.FC = () => {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex gap-2 items-center">
          <FileText className="h-6 w-6" />
          <span className="font-semibold text-lg">File Manager</span>
        </div>
        <Separator orientation="vertical" className="h-6 mx-4" />
        <div className="ml-auto flex items-center space-x-4">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
            afterSignOutUrl="/"
          />
        </div>
      </div>
    </div>
  );
}

export default NavBar;