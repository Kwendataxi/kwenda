/**
 * 🛡️ SAFETY NET - LAYER 3: ERROR BOUNDARY GLOBAL AVEC AUTO-RECOVERY
 * Ne laisse JAMAIS l'app crasher complètement
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { healthMonitor } from '@/services/HealthMonitor';
import { smartReloader } from '@/services/SmartReloader';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  crashCount: number;
  componentName: string;
  autoRecoveryAttempts: number;
  isBlacklisted: boolean;
}

const MAX_AUTO_RECOVERY = 3;
const COMPONENT_CRASH_LIMIT = 5;
const blacklistedComponents = new Set<string>();
const componentCrashCount = new Map<string, number>();

export class SafetyNet extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    crashCount: 0,
    componentName: '',
    autoRecoveryAttempts: 0,
    isBlacklisted: false
  };

  private recoveryTimer: NodeJS.Timeout | null = null;

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentStack = errorInfo.componentStack || '';
    const componentName = this.extractComponentName(componentStack);

    console.error('💥 [SafetyNet] Crash détecté:', {
      component: componentName,
      error: error.message,
      stack: componentStack.split('\n').slice(0, 3).join('\n')
    });

    // Enregistrer le crash dans le health monitor
    healthMonitor.recordCrash(componentName);

    // Tracker les crashes par composant
    const currentCount = componentCrashCount.get(componentName) || 0;
    componentCrashCount.set(componentName, currentCount + 1);

    // Vérifier si le composant doit être blacklisté
    const isBlacklisted = currentCount + 1 >= COMPONENT_CRASH_LIMIT;
    if (isBlacklisted && !blacklistedComponents.has(componentName)) {
      blacklistedComponents.add(componentName);
      console.error(`🚫 [SafetyNet] Composant blacklisté: ${componentName} (${currentCount + 1} crashes)`);
    }

    this.setState({
      errorInfo,
      componentName,
      crashCount: currentCount + 1,
      isBlacklisted
    });

    // Tentative de recovery automatique
    this.attemptAutoRecovery();
  }

  private extractComponentName(stack: string): string {
    const lines = stack.split('\n');
    const firstLine = lines.find(line => line.trim().startsWith('at '));
    
    if (firstLine) {
      const match = firstLine.match(/at (\w+)/);
      return match ? match[1] : 'Unknown';
    }
    
    return 'Unknown';
  }

  private attemptAutoRecovery() {
    const { autoRecoveryAttempts, crashCount, isBlacklisted } = this.state;

    // Si composant blacklisté, pas de recovery auto
    if (isBlacklisted) {
      console.error('🚫 Composant blacklisté, recovery manuelle requise');
      return;
    }

    // Si trop de tentatives, abandonner
    if (autoRecoveryAttempts >= MAX_AUTO_RECOVERY) {
      console.error('❌ Trop de tentatives de recovery, arrêt');
      // Proposer un reload complet
      smartReloader.scheduleReload({
        type: 'crash',
        severity: 'critical',
        message: 'Crashes répétés détectés'
      }, 10000);
      return;
    }

    // Stratégie de recovery progressive
    const delays = [2000, 5000, 10000]; // 2s, 5s, 10s
    const delay = delays[autoRecoveryAttempts] || 10000;

    console.log(`🔄 [SafetyNet] Tentative de recovery ${autoRecoveryAttempts + 1}/${MAX_AUTO_RECOVERY} dans ${delay}ms`);

    this.recoveryTimer = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        autoRecoveryAttempts: prevState.autoRecoveryAttempts + 1
      }));
    }, delay);
  }

  private handleManualReload = () => {
    localStorage.removeItem('kwenda_user_roles_cache');
    window.location.reload();
  };

  private handleGoHome = () => {
    // 🛡️ Rediriger vers le dashboard approprié, pas vers '/'
    const selectedRole = localStorage.getItem('kwenda_selected_role');
    const dashboardPath = selectedRole === 'driver' ? '/app/chauffeur'
      : selectedRole === 'partner' ? '/app/partenaire'
      : selectedRole === 'admin' ? '/operatorx/admin'
      : '/app/client';
    
    window.location.href = dashboardPath;
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public componentWillUnmount() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }
  }

  public render() {
    if (this.state.hasError) {
      const { error, componentName, crashCount, isBlacklisted, autoRecoveryAttempts } = this.state;
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 space-y-4 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
            
            <h1 className="text-2xl font-bold text-gray-900">
              {isBlacklisted ? 'Erreur critique' : 'Problème détecté'}
            </h1>
            
            <p className="text-gray-600">
              {isBlacklisted 
                ? `Le composant "${componentName}" rencontre des problèmes répétés (${crashCount}x). Un redémarrage est nécessaire.`
                : autoRecoveryAttempts > 0
                  ? `Tentative de récupération automatique (${autoRecoveryAttempts}/${MAX_AUTO_RECOVERY})...`
                  : 'L\'application a rencontré un problème et tente de se rétablir.'
              }
            </p>

            {error && (
              <details className="text-left text-sm bg-gray-50 p-3 rounded">
                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                  Détails techniques
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="font-semibold">Composant :</span>
                    <pre className="mt-1 text-xs overflow-auto bg-white p-2 rounded border">
                      {componentName} (crashes: {crashCount})
                    </pre>
                  </div>
                  <div>
                    <span className="font-semibold">Message :</span>
                    <pre className="mt-1 text-xs overflow-auto bg-white p-2 rounded border">
                      {error.message}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            <div className="space-y-2 pt-2">
              {!isBlacklisted && autoRecoveryAttempts < MAX_AUTO_RECOVERY && (
                <Button 
                  onClick={this.handleRetry} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer maintenant
                </Button>
              )}
              
              <Button 
                onClick={this.handleManualReload} 
                className="w-full"
                variant={isBlacklisted ? "default" : "outline"}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Redémarrer l'application
              </Button>
              
              <Button 
                onClick={this.handleGoHome} 
                className="w-full"
                variant="ghost"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </div>

            <p className="text-xs text-gray-500 pt-2">
              Si le problème persiste, contactez le support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
