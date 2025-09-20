import * as React from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConfigurationFormProps {
  onSubmit: (values: { projectId: string; apiKey:string; region: string }) => void;
  isLoading: boolean;
}

export const ConfigurationForm = ({ onSubmit, isLoading }: ConfigurationFormProps) => {
  const form = useForm({
    defaultValues: {
      projectId: '',
      apiKey: '',
      region: 'US',
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <Card className="max-w-2xl mx-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Provide your PostHog Project ID and Personal API Key.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form.Field
            name="projectId"
            validators={{
              onChange: ({ value }) => {
                const schema = z.string().min(1, 'Project ID is required.');
                const result = schema.safeParse(value);
                if (!result.success) {
                  return result.error.issues[0].message;
                }
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Project ID</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Your PostHog Project ID"
                />
                {field.state.meta.errors?.[0] ? (
                  <em className="text-destructive text-sm">{field.state.meta.errors[0]}</em>
                ) : null}
              </div>
            )}
          />
          <form.Field
            name="apiKey"
            validators={{
              onChange: ({ value }) => {
                const schema = z.string().min(1, 'API Key is required.');
                const result = schema.safeParse(value);
                if (!result.success) {
                  return result.error.issues[0].message;
                }
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Personal API Key</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Your PostHog API Key"
                />
                {field.state.meta.errors?.[0] ? (
                  <em className="text-destructive text-sm">{field.state.meta.errors[0]}</em>
                ) : null}
              </div>
            )}
          />
          <form.Field
            name="region"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Region</Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">US</SelectItem>
                    <SelectItem value="EU">EU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        </CardContent>
        <CardFooter>
            <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting || isLoading}>
                        {isLoading ? "Connecting..." : "Load Saved Queries"}
                    </Button>
                )}
            />
        </CardFooter>
      </form>
    </Card>
  );
};