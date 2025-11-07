import { NotificationSoundTest } from '@/components/debug/NotificationSoundTest';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { notificationSoundService } from '@/services/notificationSound';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const TestSoundsPage = () => {
  const navigate = useNavigate();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(90);

  useEffect(() => {
    setSoundEnabled(notificationSoundService.getSoundEnabled());
    setVolume(Math.round(notificationSoundService.getVolume() * 100));
  }, []);

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    notificationSoundService.setSoundEnabled(enabled);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    notificationSoundService.setVolume(newVolume / 100);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Test des Sons</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Global Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-primary" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              Réglages Globaux
            </CardTitle>
            <CardDescription>
              Contrôlez le volume et l'activation des sons de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Toggle Son */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-toggle">Sons activés</Label>
                <p className="text-sm text-muted-foreground">
                  {soundEnabled ? 'Les sons sont activés' : 'Les sons sont désactivés'}
                </p>
              </div>
              <Switch
                id="sound-toggle"
                checked={soundEnabled}
                onCheckedChange={handleToggleSound}
              />
            </div>

            {/* Volume Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Volume</Label>
                <span className="text-sm text-muted-foreground">{volume}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={5}
                disabled={!soundEnabled}
                className="w-full"
              />
            </div>

            {/* Info */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Info :</strong> Les réglages sont sauvegardés localement et appliqués à toutes les notifications.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sound Test Component */}
        <NotificationSoundTest />

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>📖 Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Test des sons :</strong>
              <p className="text-muted-foreground">
                Cliquez sur chaque bouton pour tester le son correspondant. 
                Vérifiez qu'ils sont distincts et reconnaissables.
              </p>
            </div>
            
            <div>
              <strong>2. Vibrations (mobile) :</strong>
              <p className="text-muted-foreground">
                Sur mobile, chaque son est couplé avec un pattern de vibration unique.
              </p>
            </div>
            
            <div>
              <strong>3. Fallback automatique :</strong>
              <p className="text-muted-foreground">
                Si les fichiers MP3 n'existent pas encore, des sons synthétiques sont générés automatiquement.
              </p>
            </div>
            
            <div>
              <strong>4. Installation des sons :</strong>
              <p className="text-muted-foreground">
                Consultez <code className="bg-muted px-2 py-1 rounded">public/sounds/README.md</code> pour télécharger des sons de qualité professionnelle.
              </p>
            </div>

            <div className="pt-4 border-t">
              <strong>🔍 Vérifications :</strong>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                <li>Ouvrez la console du navigateur pour voir les logs détaillés</li>
                <li>Vérifiez qu'il n'y a pas d'erreurs 404 pour les fichiers audio</li>
                <li>Testez avec différents niveaux de volume</li>
                <li>Testez sur mobile pour valider les vibrations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
