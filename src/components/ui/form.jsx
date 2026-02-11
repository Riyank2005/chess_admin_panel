import * as React from "react";
import { Controller, useFormContext, FormProvider } from "react-hook-form";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// Form provider
const Form = FormProvider;

// Contexts
const FormFieldContext = React.createContext({});
const FormItemContext = React.createContext({});

// FormField component
const FormField = ({ name, control, render }) => {
  return (
    <FormFieldContext.Provider value={{ name }}>
      <Controller name={name} control={control} render={render} />
    </FormFieldContext.Provider>
  );
};

// Hook to access field + item info
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext) throw new Error("useFormField must be inside FormField");

  const { name } = fieldContext;
  const { id } = itemContext || {};
  const fieldState = getFieldState(name, formState);

  return {
    id,
    name,
    formItemId: id ? `${id}-form-item` : undefined,
    formDescriptionId: id ? `${id}-form-item-description` : undefined,
    formMessageId: id ? `${id}-form-item-message` : undefined,
    ...fieldState,
  };
};

// FormItem
const FormItem = React.forwardRef(({ className, children, ...props }, ref) => {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

// FormLabel
const FormLabel = React.forwardRef(({ className, children, ...props }, ref) => {
  const { formItemId, error } = useFormField();
  return (
    <Label ref={ref} className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props}>
      {children}
    </Label>
  );
});
FormLabel.displayName = "FormLabel";

// FormControl
const FormControl = React.forwardRef(({ ...props }, ref) => {
  const { formItemId, formDescriptionId, formMessageId, error } = useFormField();
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-invalid={!!error}
      aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

// FormDescription
const FormDescription = React.forwardRef(({ className, children, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  return (
    <p ref={ref} id={formDescriptionId} className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
});
FormDescription.displayName = "FormDescription";

// FormMessage
const FormMessage = React.forwardRef(({ className, ...props }, ref) => {
  const { formMessageId, error } = useFormField();
  if (!error) return null;
  return (
    <p ref={ref} id={formMessageId} className={cn("text-sm font-medium text-destructive", className)} {...props}>
      {String(error.message)}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
};
