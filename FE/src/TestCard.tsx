"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Cross2Icon, ChevronDownIcon } from "@radix-ui/react-icons";

export default function RadixTailwindTest() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8">
      {/* Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-md hover:bg-blue-700 transition">
            Open Menu
            <ChevronDownIcon />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content
          className="rounded-md bg-white p-2 shadow-xl border border-gray-200"
          sideOffset={5}
        >
          <DropdownMenu.Item className="cursor-pointer rounded px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none">
            Profile
          </DropdownMenu.Item>
          <DropdownMenu.Item className="cursor-pointer rounded px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none">
            Settings
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

          <Dialog.Root>
            <Dialog.Trigger asChild>
              <DropdownMenu.Item
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 outline-none"
              >
                Open Dialog
              </DropdownMenu.Item>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

              <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="text-lg font-semibold">
                  Radix + Tailwind Test
                </Dialog.Title>

                <Dialog.Description className="mt-2 text-sm text-gray-500">
                  This dialog is styled with Tailwind but powered by Radix UI.
                </Dialog.Description>

                <div className="mt-6 flex justify-end">
                  <Dialog.Close asChild>
                    <button className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 transition">
                      Close
                    </button>
                  </Dialog.Close>
                </div>

                <Dialog.Close asChild>
                  <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    <Cross2Icon />
                  </button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}