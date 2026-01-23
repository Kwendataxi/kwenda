import React from 'react';
import { Home, Building, Check, MoreVertical, Edit, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface AddressData {
  id: string;
  label: string;
  address_line: string;
  city: string;
  commune?: string;
  quartier?: string;
  coordinates?: any;
  is_default: boolean;
  address_type: string;
  usage_count?: number;
  created_at: string;
}

interface AddressChipProps {
  address: AddressData;
  isSelected?: boolean;
  onClick?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  compact?: boolean;
}

export const AddressChip = ({
  address,
  isSelected = false,
  onClick,
  showActions = false,
  onEdit,
  onDelete,
  onSetDefault,
  compact = false,
}: AddressChipProps) => {
  const isPersonal = address.address_type !== 'business';
  const Icon = isPersonal ? Home : Building;

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-2xl transition-all duration-200",
        compact ? "py-2.5 px-3" : "py-3.5 px-4",
        "bg-blue-50/50 dark:bg-blue-950/20",
        "border border-blue-100/50 dark:border-blue-900/30",
        onClick && "cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 active:scale-[0.98]",
        isSelected && "ring-2 ring-blue-500/30"
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={cn(
        "flex items-center justify-center rounded-xl",
        compact ? "h-9 w-9" : "h-10 w-10",
        "bg-blue-100/80 dark:bg-blue-900/40"
      )}>
        <Icon className={cn(
          "text-blue-600 dark:text-blue-400",
          compact ? "h-4 w-4" : "h-5 w-5"
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-foreground truncate",
          compact ? "text-sm" : "text-base"
        )}>
          {address.label}
        </p>
        {!compact && (
          <p className="text-xs text-muted-foreground truncate">
            {address.address_line}
          </p>
        )}
      </div>

      {/* Favorite indicator */}
      {address.is_default && (
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500">
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      {/* Actions menu */}
      {showActions && (onEdit || onDelete || onSetDefault) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {onSetDefault && !address.is_default && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onSetDefault();
              }}>
                <Star className="h-4 w-4 mr-2" />
                Favori
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
