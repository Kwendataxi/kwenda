import React, { memo } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, TreePine, Sparkles, Heart, Palette, Snowflake, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useSeasonalThemeSafe, SeasonalTheme } from '@/contexts/SeasonalThemeContext';
import { cn } from '@/lib/utils';

const seasonalOptions: { value: SeasonalTheme; label: string; icon: React.ReactNode; gradient: string }[] = [
  { 
    value: 'default', 
    label: 'Défaut', 
    icon: <Palette className="h-4 w-4" />,
    gradient: 'from-orange-300 to-amber-400'
  },
  { 
    value: 'christmas', 
    label: 'Noël', 
    icon: <TreePine className="h-4 w-4" />,
    gradient: 'from-rose-300 via-emerald-300 to-amber-200'
  },
  { 
    value: 'newYear', 
    label: 'Nouvel An', 
    icon: <Sparkles className="h-4 w-4" />,
    gradient: 'from-violet-300 via-purple-300 to-indigo-300'
  },
  { 
    value: 'valentine', 
    label: 'Valentin', 
    icon: <Heart className="h-4 w-4" />,
    gradient: 'from-pink-300 via-rose-300 to-red-300'
  },
];

const themeOptions = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
];

const SeasonalThemeSelector = memo(() => {
  const { theme, setTheme } = useTheme();
  const { 
    currentSeason, 
    setSeason, 
    isAutoMode, 
    setAutoMode,
    effectsEnabled,
    setEffectsEnabled 
  } = useSeasonalThemeSafe();

  const currentSeasonOption = seasonalOptions.find(o => o.value === currentSeason) || seasonalOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted/80 backdrop-blur-sm transition-all duration-300 hover:scale-105">
          {currentSeason === 'christmas' ? (
            <Snowflake className="h-[18px] w-[18px] text-emerald-500" />
          ) : currentSeason === 'newYear' ? (
            <Sparkles className="h-[18px] w-[18px] text-violet-500" />
          ) : currentSeason === 'valentine' ? (
            <Heart className="h-[18px] w-[18px] text-pink-500" />
          ) : theme === 'dark' ? (
            <Moon className="h-[18px] w-[18px] text-foreground/70" strokeWidth={1.5} />
          ) : (
            <Sun className="h-[18px] w-[18px] text-foreground/70" strokeWidth={1.5} />
          )}
          
          {currentSeason !== 'default' && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
              "bg-gradient-to-br shadow-sm",
              currentSeasonOption.gradient
            )} />
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        sideOffset={8} 
        className="w-64 p-0 overflow-hidden rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-xl z-[200] animate-in fade-in-0 slide-in-from-top-2 duration-200"
      >
        {/* Header élégant */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/50">
          <div className="p-2 rounded-xl bg-primary/10">
            <Palette className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Apparence</h3>
            <p className="text-[11px] text-muted-foreground">Personnalisez votre expérience</p>
          </div>
        </div>

        {/* Mode Clair/Sombre/Auto - Pill buttons */}
        <div className="p-3">
          <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg",
                    "transition-all duration-300 text-xs font-medium",
                    isActive 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ambiances saisonnières - Grille 2x2 */}
        <div className="px-3 pb-2">
          <p className="text-[11px] text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Ambiance saisonnière
          </p>
          <div className="grid grid-cols-2 gap-2">
            {seasonalOptions.map((option) => {
              const isActive = currentSeason === option.value && !isAutoMode;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setSeason(option.value);
                    setAutoMode(false);
                  }}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-3 rounded-xl",
                    "transition-all duration-300 border-2",
                    isActive 
                      ? "border-primary/40 bg-primary/5 scale-[1.02]" 
                      : "border-transparent bg-muted/30 hover:bg-muted/50 hover:scale-[1.01]"
                  )}
                >
                  {/* Cercle gradient soft */}
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br shadow-md",
                    option.gradient
                  )}>
                    <span className="text-white/90">{option.icon}</span>
                  </div>
                  
                  <span className="text-xs font-medium">{option.label}</span>
                  
                  {/* Check animé */}
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Options avec Switch élégants */}
        <div className="p-3 pt-2 space-y-1 border-t border-border/50 bg-muted/20">
          <label 
            className={cn(
              "flex items-center justify-between gap-3 p-2.5 rounded-xl cursor-pointer",
              "transition-all duration-200",
              isAutoMode ? "bg-primary/10" : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Auto (selon date)</span>
            </div>
            <Switch 
              checked={isAutoMode} 
              onCheckedChange={setAutoMode}
              className="scale-90 data-[state=checked]:bg-primary"
            />
          </label>
          
          <label 
            className={cn(
              "flex items-center justify-between gap-3 p-2.5 rounded-xl cursor-pointer",
              "transition-all duration-200",
              currentSeason === 'default' ? "opacity-50 cursor-not-allowed" : "",
              effectsEnabled && currentSeason !== 'default' ? "bg-primary/10" : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Snowflake className="h-3.5 w-3.5 text-sky-500" />
              <span className="text-xs font-medium">Animations festives</span>
            </div>
            <Switch 
              checked={effectsEnabled} 
              onCheckedChange={setEffectsEnabled}
              disabled={currentSeason === 'default'}
              className="scale-90 data-[state=checked]:bg-primary"
            />
          </label>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

SeasonalThemeSelector.displayName = 'SeasonalThemeSelector';

export { SeasonalThemeSelector };
