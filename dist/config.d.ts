export declare const GLOBAL_CONFIG_FILE: string;
export declare const DEFAULT_OVERLAY_REPO = "RebelliousSmile/aidd-claude-custom";
export declare function getGlobalConfig(): {
    repo: string;
    branch: string;
} | null;
export declare function getOverlayConfig(_projectRoot: string): {
    repo: string;
    branch: string;
} | null;
export declare function getGlobalPlugins(): Record<string, {
    installed: boolean;
}>;
export declare function saveGlobalPlugins(plugins: Record<string, {
    installed: boolean;
}>): void;
//# sourceMappingURL=config.d.ts.map