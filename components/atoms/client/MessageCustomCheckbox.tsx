'use client'

import React from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { FormControl, FormField, FormItem } from '@/components/ui/form'
import { Label } from '@/components/ui/label'

interface CustomCheckboxProps<T extends {_id: string; firstname: string; lastname: string}> {
  items: T[]
  form: any // useForm instance
  formFieldName: string
}

export const CustomCheckbox = <T extends {_id: string; firstname: string; lastname: string}>({
  items,
  form,
  formFieldName,
}: CustomCheckboxProps<T>) => {
  const selectedItems = form.watch(formFieldName) || []

  const allSelected = items.every((item) => selectedItems.includes(item._id))

  const handleSelectAll = (checked: boolean) => {
    const itemIds = items.map((item) => item._id)
    const updatedSelection = checked
      ? Array.from(new Set([...selectedItems, ...itemIds]))
      : selectedItems.filter((id: string) => !itemIds.includes(id))

    form.setValue(formFieldName, updatedSelection)
  }

  const handleIndividualChange = (checked: boolean, id: string) => {
    const updatedSelection = checked
      ? [...selectedItems, id]
      : selectedItems.filter((itemId: string) => itemId !== id)

    form.setValue(formFieldName, updatedSelection)
  }

  return (
    <div className="space-y-2">
      {/* Checkbox pour tout sélectionner */}
      <div className="flex items-center space-x-3 px-4 py-2 border-b">
        <Checkbox
          id="select-all"
          checked={allSelected}
          onCheckedChange={handleSelectAll}
          className="data-[state=checked]:bg-green-500"
        />
        <Label htmlFor="select-all" className="text-sm font-medium text-gray-800 cursor-pointer">
          Tout sélectionner
        </Label>
      </div>

      {/* Liste des éléments */}
      {items.map((item) => {
        const isChecked = selectedItems.includes(item._id)

        return (
          <FormField
            key={item._id}
            name={formFieldName}
            render={() => (
              <FormItem>
                <Label
                  htmlFor={`checkbox-${item._id}`}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer transition duration-200 ease-in-out ${
                    isChecked
                      ? 'bg-green-50 border border-green-500'
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <FormControl>
                    <Checkbox
                      id={`checkbox-${item._id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleIndividualChange(checked as boolean, item._id)
                      }
                      className="data-[state=checked]:bg-green-500"
                    />
                  </FormControl>
                  <span
                    className={`text-sm font-medium ${isChecked ? 'text-green-600' : 'text-gray-800'}`}
                  >
                    {item.firstname} {item.lastname}
                  </span>
                </Label>
              </FormItem>
            )}
          />
        )
      })}
    </div>
  )
}
