/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    visibility?: {
      schemaVersion: number;
      revision: string;
      pages: Record<
        string,
        { enabled: boolean; sections: Record<string, boolean> }
      >;
    };
    visibilityPageId?: string;
  }
}
