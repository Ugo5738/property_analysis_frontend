declare module '@/components/ui/carousel' {
    export const Carousel: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    export const CarouselContent: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    export const CarouselItem: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    export const CarouselNext: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
    export const CarouselPrevious: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  }
  
  declare module '@/components/ui/card' {
    export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
  }

  declare module '@/components/ui/tabs' {
    import * as React from 'react';
  
    interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
      defaultValue?: string;
      value?: string;
      onValueChange?: (value: string) => void;
    }
  
    interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}
  
    interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
      value: string;
    }
  
    interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
      value: string;
    }
  
    export const Tabs: React.FC<TabsProps>;
    export const TabsList: React.FC<TabsListProps>;
    export const TabsTrigger: React.FC<TabsTriggerProps>;
    export const TabsContent: React.FC<TabsContentProps>;
  }
  
  declare module '@/components/ui/input' {
    export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
  }
  
  declare module '@/components/ui/button' {
    export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  }
  
  declare module '@/components/ui/alert' {
    import { VariantProps } from "class-variance-authority";
    import { alertVariants } from "./alert";
  
    export interface AlertProps
      extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof alertVariants> {}
  
    export const Alert: React.FC<AlertProps>;
    export const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    export const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
  }

declare module '@/components/ui/dialog' {
  import * as React from 'react';

  interface DialogProps extends React.ComponentPropsWithoutRef<'div'> {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  interface DialogContentProps extends React.ComponentPropsWithoutRef<'div'> {
    forceMount?: true;
  }

  interface DialogTriggerProps extends React.ComponentPropsWithoutRef<'button'> {
    asChild?: boolean;
  }

  export const Dialog: React.FC<DialogProps>;
  export const DialogContent: React.FC<DialogContentProps>;
  export const DialogTrigger: React.FC<DialogTriggerProps>;
}

declare module '@/components/ui/table' {
  import * as React from 'react';

  export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>>;
  export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>>;
  export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>>;
  export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>>;
  export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>>;
  export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>>;
}