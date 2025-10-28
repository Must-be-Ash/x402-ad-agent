/**
 * Logger
 *
 * Simple logger utility for agent output with consistent formatting.
 * Supports different log levels and can be configured for verbose mode.
 */
export class Logger {
  constructor(
    private agentName: string,
    private verbose: boolean = false
  ) {}

  /**
   * Debug logs - only shown in verbose mode
   */
  debug(message: string): void {
    if (this.verbose) {
      console.log(`🔍 [${this.agentName}] ${message}`);
    }
  }

  /**
   * Info logs - general information
   */
  info(message: string): void {
    console.log(`ℹ️  [${this.agentName}] ${message}`);
  }

  /**
   * Success logs - operations completed successfully
   */
  success(message: string): void {
    console.log(`✅ [${this.agentName}] ${message}`);
  }

  /**
   * Warning logs - potential issues
   */
  warn(message: string): void {
    console.warn(`⚠️  [${this.agentName}] ${message}`);
  }

  /**
   * Error logs - failures and exceptions
   */
  error(message: string, error?: any): void {
    console.error(`❌ [${this.agentName}] ${message}`);
    if (error && this.verbose) {
      console.error(error);
    }
  }

  /**
   * Tool logs - AI tool invocations
   */
  tool(toolName: string, message: string): void {
    console.log(`⚡ [${this.agentName}] Tool: ${toolName} - ${message}`);
  }

  /**
   * Thinking logs - AI reasoning process
   */
  thinking(message: string): void {
    console.log(`🧠 [${this.agentName}] ${message}`);
  }
}
