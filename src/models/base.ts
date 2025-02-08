import { ShortcutClient } from "@shortcut/client";
import { ExtensionContext as vscodeExtensionContext } from "vscode";

/**
 * Base model class that provides common functionality for all models in the application.
 * Serves as the parent class for all other model classes and maintains shared resources.
 */
export class BaseModel {
    /** The Shortcut API client instance used for making API requests */
    static client: ShortcutClient;
    /** The VS Code extension context */
    static context: vscodeExtensionContext;
}
    