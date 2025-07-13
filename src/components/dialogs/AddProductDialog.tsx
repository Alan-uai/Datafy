
"use client";

import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import type { Product, Category } from "@/lib/types";
import { CustomNumberInput } from "../ui/CustomNumberInput";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  brand: z.string().min(2, { message: "A marca deve ter pelo menos 2 caracteres." }),
  quantity: z.coerce.number().int({ message: "A quantidade deve ser um número inteiro." }).min(1, { message: "A quantidade deve ser pelo menos 1." }),
  price: z.coerce.number().min(0.01, { message: "O preço deve ser positivo." }),
  expiryDate: z.date({
    required_error: "A data de validade é obrigatória.",
  }),
  category: z.string({
    required_error: "Por favor, selecione uma categoria.",
  }),
});

type AddProductDialogProps = {
  children: React.ReactNode;
  categories: Category[];
  onSave: (product: Omit<Product, "id" | "listId">) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct?: Product | null;
};

export function AddProductDialog({ children, categories, onSave, open, onOpenChange, editingProduct }: AddProductDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", brand: "", quantity: 1, price: 0 },
  });

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        brand: editingProduct.brand,
        quantity: editingProduct.quantity,
        price: editingProduct.price,
        expiryDate: new Date(editingProduct.expiryDate),
        category: editingProduct.category,
      });
    } else {
      form.reset({ name: "", brand: "", quantity: 1, price: 0, expiryDate: undefined, category: undefined });
    }
  }, [editingProduct, open, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editingProduct ? "Editar Produto" : "Adicionar Novo Item"}</DialogTitle>
          <DialogDescription>
            {editingProduct ? "Altere as informações do produto." : "Preencha as informações do produto para adicioná-lo."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nome do item</FormLabel> <FormControl><Input placeholder="Ex: Leite Integral" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem> <FormLabel>Marca</FormLabel> <FormControl><Input placeholder="Ex: Leitissimo" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                       <CustomNumberInput
                          value={field.value}
                          onChange={field.onChange}
                          min={1}
                          step={1}
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (un.)</FormLabel>
                     <FormControl>
                       <CustomNumberInput
                          value={field.value}
                          onChange={field.onChange}
                          min={0}
                          step={0.01}
                          formatValue={(value) => `R$ ${value.toFixed(2).replace('.', ',')}`}
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem className="flex flex-col pt-2"><FormLabel className="mb-1">Data de validade</FormLabel>
                  <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl></PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus locale={ptBR} />
                  </PopoverContent></Popover><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem className="pt-2"><FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{categories.map((category) => ( <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem> ))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
               <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
               <Button type="submit">{editingProduct ? "Salvar Alterações" : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
