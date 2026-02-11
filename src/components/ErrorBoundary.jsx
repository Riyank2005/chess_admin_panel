import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });

        // Log to error reporting service (e.g., Sentry)
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6">
                    <div className="prism-card max-w-2xl w-full p-8 space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="h-20 w-20 rounded-full bg-destructive/20 flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-destructive" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-foreground">
                                System Error Detected
                            </h1>
                            <p className="text-muted-foreground">
                                An unexpected error occurred in the Master Control system.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-black/40 rounded-lg p-4 text-left space-y-2">
                                <p className="text-sm font-mono text-red-400">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="flex gap-4 justify-center flex-wrap">
                            <Button
                                onClick={this.handleReset}
                                variant="outline"
                                className="prism-btn-outline"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>

                            <Button
                                onClick={this.handleReload}
                                variant="outline"
                                className="prism-btn-outline"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reload Page
                            </Button>

                            <Button
                                onClick={this.handleGoHome}
                                className="prism-btn"
                            >
                                <Home className="mr-2 h-4 w-4" />
                                Return to Dashboard
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Error ID: {Date.now().toString(36)}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
