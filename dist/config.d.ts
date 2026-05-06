export declare const GLOBAL_CONFIG_FILE: string;
export declare const DEFAULT_OVERLAY_REPO = "RebelliousSmile/aidd-overlay";
export declare function getGlobalConfig(): {
    repo: string;
    branch: string;
} | null;
export declare function getOverlayConfig(projectRoot: string): {
    repo: string;
    branch: string;
};
//# sourceMappingURL=config.d.ts.map