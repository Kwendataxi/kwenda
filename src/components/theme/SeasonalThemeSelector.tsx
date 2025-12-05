import React, { memo } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, TreePine, Sparkles, Heart, Palette, Snowflake } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useSeasonalThemeSafe, SeasonalTheme } from '@/contexts/SeasonalThemeContext';
import { cn } from '@/lib/utils';

const seasonalOptions: { value: SeasonalTheme; label: string; icon: React.ReactNode; gradient: string }[] = [
  { 
    value: 'default', 
    label: 'Par défaut', 
    icon: <Palette className="h-4 w-4" />,
    gradient: 'from-primary to-accent'
  },
  { 
    value: 'christmas', 
    label: '🎄 Noël', 
    icon: <TreePine className="h-4 w-4 text-green-500" />,
    gradient: 'from-red-500 via-green-600 to-amber-500'
  },
  { 
    value: 'newYear', 
    label: '🎆 Nouvel An', 
    icon: <Sparkles className="h-4 w-4 text-amber-400" />,
    gradient: 'from-amber-400 via-purple-500 to-blue-500'
  },
  { 
    value: 'valentine', 
    label: '💝 Saint-Valentin', 
    icon: <Heart className="h-4 w-4 text-pink-500" />,
    gradient: 'from-pink-500 via-red-500 to-rose-400'
  },
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
        <Button 
          variant="ghost" 
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-muted/80 transition-all"
        >
          {/* Icône dynamique selon la saison */}
          {currentSeason === 'christmas' ? (
            <Snowflake className="h-5 w-5 text-sky-400 animate-pulse" />
          ) : currentSeason === 'newYear' ? (
            <Sparkles className="h-5 w-5 text-amber-400" />
          ) : currentSeason === 'valentine' ? (
            <Heart className="h-5 w-5 text-pink-500" />
          ) : theme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
          
          {/* Indicateur de saison active */}
          {currentSeason !== 'default' && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full",
              "bg-gradient-to-r",
              currentSeasonOption.gradient,
              "ring-2 ring-background"
            )} />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 z-[200]">
        {/* Section Mode (Clair/Sombre) */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
          Mode d'affichage
        </DropdownMenuLabel>
        
        <div className="flex gap-1 p-1">
          <Button
            variant={theme === 'light' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => setTheme('light')}
          >
            <Sun className="h-3.5 w-3.5 mr-1.5" />
            Clair
          </Button>
          <Button
            variant={theme === 'dark' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-3.5 w-3.5 mr-1.5" />
            Sombre
          </Button>
          <Button
            variant={theme === 'system' ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => setTheme('system')}
          >
            <Monitor className="h-3.5 w-3.5 mr-1.5" />
            Auto
          </Button>
        </div>

        <DropdownMenuSeparator className="my-2" />
        
        {/* Section Ambiance Saisonnière */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-medium flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          Ambiance saisonnière
        </DropdownMenuLabel>
        
        <div className="p-1 space-y-1">
          {seasonalOptions.map((option) => (
            <Button
              key={option.value}
              variant={currentSeason === option.value && !isAutoMode ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "w-full justify-start h-9 text-xs",
                currentSeason === option.value && !isAutoMode && "ring-1 ring-primary/30"
              )}
              onClick={() => {
                setSeason(option.value);
                setAutoMode(false);
              }}
            >
              <div className={cn(
                "h-4 w-4 rounded-full mr-2 bg-gradient-to-r",
                option.gradient
              )} />
              {option.label}
              {currentSeason === option.value && !isAutoMode && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </Button>
          ))}
        </div>

        <DropdownMenuSeparator className="my-2" />

        {/* Options */}
        <DropdownMenuCheckboxItem
          checked={isAutoMode}
          onCheckedChange={setAutoMode}
          className="text-xs"
        >
          <Sparkles className="h-3 w-3 mr-2" />
          Auto (selon la date)
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={effectsEnabled}
          onCheckedChange={setEffectsEnabled}
          className="text-xs"
          disabled={currentSeason === 'default'}
        >
          <Snowflake className="h-3 w-3 mr-2" />
          Animations festives
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

SeasonalThemeSelector.displayName = 'SeasonalThemeSelector';

export { SeasonalThemeSelector };
