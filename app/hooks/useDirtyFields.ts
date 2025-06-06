import { useState, useEffect, useCallback } from 'react';
import type { EditableInvoice } from '@/app/types';

export const useDirtyFields = (fields: EditableInvoice) => {
  const [originalValues, setOriginalValues] = useState<EditableInvoice | null>(null);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [globalDirtyOperations, setGlobalDirtyOperations] = useState<Set<string>>(new Set());
  const [newlyAddedItems, setNewlyAddedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!originalValues && fields && Object.keys(fields).length > 0) {
      setOriginalValues(JSON.parse(JSON.stringify(fields)));
      setDirtyFields(new Set());
      setGlobalDirtyOperations(new Set());
      setNewlyAddedItems(new Set());
    }
  }, [fields, originalValues]);

  const isFieldDirty = useCallback((fieldPath: string, currentValue: string | number | undefined | null) => {
    if (!originalValues) return false;
    
    const pathParts = fieldPath.split('_');
    let originalValue: unknown = originalValues;
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      
      if (!originalValue || typeof originalValue !== 'object') return false;
      if (part === 'seller' || part === 'buyer') {
        originalValue = (originalValue as Record<string, unknown>)[part];
        
        if (i + 1 < pathParts.length) {
          const fieldName = pathParts.slice(i + 1).join('_');
          originalValue = (originalValue as Record<string, unknown>)?.[fieldName];
          break; 
        }
      } else if (part === 'field') {
        continue;
      } else if (part === 'item') {
        continue;
      } else if (!isNaN(parseInt(part))) {
        const obj = originalValue as Record<string, unknown>;
        if (!obj.invoice_data || !Array.isArray(obj.invoice_data)) {
          return false;
        }
        originalValue = obj.invoice_data[parseInt(part)];
      } else {
        const fieldName = pathParts.slice(i).join('_');
        originalValue = (originalValue as Record<string, unknown>)?.[fieldName];
        break; 
      }
    }
    
    const currentStr = String(currentValue || '');
    const originalStr = String(originalValue || '');
    
    return currentStr !== originalStr;
  }, [originalValues]);

  useEffect(() => {
    if (!originalValues || !fields) return;

    const newDirtyFields = new Set<string>();

    if (fields.seller) {
      Object.keys(fields.seller).forEach(key => {
        const fieldPath = `seller_${key}`;
        const currentValue = (fields.seller as unknown as Record<string, unknown>)[key];
        if (isFieldDirty(fieldPath, currentValue as string)) {
          newDirtyFields.add(fieldPath);
        }
      });
    }

    if (fields.buyer) {
      Object.keys(fields.buyer).forEach(key => {
        const fieldPath = `buyer_${key}`;
        const currentValue = (fields.buyer as unknown as Record<string, unknown>)[key];
        if (isFieldDirty(fieldPath, currentValue as string)) {
          newDirtyFields.add(fieldPath);
        }
      });
    }

    const mainFields = ['invoice_number', 'payment_method', 'currency', 'issue_date', 'due_date', 'fulfillment_date'];
    mainFields.forEach(key => {
      const fieldPath = `field_${key}`;
      const currentValue = (fields as unknown as Record<string, unknown>)[key];
      if (isFieldDirty(fieldPath, currentValue as string)) {
        newDirtyFields.add(fieldPath);
      }
    });

    if (fields.invoice_data && Array.isArray(fields.invoice_data)) {
      const originalItemsCount = originalValues.invoice_data?.length || 0;
      const currentItemsCount = fields.invoice_data.length;
      
      const compareCount = Math.min(originalItemsCount, currentItemsCount);
      
      for (let index = 0; index < compareCount; index++) {
        const item = fields.invoice_data[index];
        Object.keys(item).forEach(key => {
          const fieldPath = `item_${index}_${key}`;
          const currentValue = (item as unknown as Record<string, unknown>)[key];
          if (isFieldDirty(fieldPath, currentValue as string)) {
            newDirtyFields.add(fieldPath);
          }
        });
      }
    }

    setDirtyFields(newDirtyFields);
  }, [fields, originalValues, isFieldDirty]);

  const markFieldDirty = (fieldPath: string, currentValue: string | number | undefined | null) => {
    if (!originalValues) return;
    
    setDirtyFields(prev => {
      const newSet = new Set(prev);
      if (isFieldDirty(fieldPath, currentValue)) {
        newSet.add(fieldPath);
      } else {
        newSet.delete(fieldPath);
      }
      return newSet;
    });
  };

  const clearDirtyField = (fieldPath: string) => {
    setDirtyFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldPath);
      return newSet;
    });
  };

  const clearAllDirty = () => {
    setDirtyFields(new Set());
    setGlobalDirtyOperations(new Set());
    setNewlyAddedItems(new Set());
  };

  const markGlobalOperation = (operation: string) => {
    setGlobalDirtyOperations(prev => new Set([...prev, operation]));
  };

  const markItemAdded = (index: number) => {
    setNewlyAddedItems(prev => new Set([...prev, index]));
    markGlobalOperation(`item_added_${index}_${Date.now()}`);
  };

  const markItemDeleted = (index: number) => {
    const isNewlyAdded = newlyAddedItems.has(index);
    
    if (isNewlyAdded) {
      setGlobalDirtyOperations(prev => {
        const newSet = new Set(prev);
        for (const op of prev) {
          if (op.startsWith(`item_added_${index}_`)) {
            newSet.delete(op);
            break;
          }
        }
        return newSet;
      });
      
      setNewlyAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        const updatedItems = new Set<number>();
        for (const itemIndex of newSet) {
          if (itemIndex > index) {
            updatedItems.add(itemIndex - 1);
          } else {
            updatedItems.add(itemIndex);
          }
        }
        return updatedItems;
      });
    } else {
      markGlobalOperation(`item_deleted_${index}_${Date.now()}`);
    }
  };

  const clearItemDirtyFields = (deletedIndex: number) => {
    setOriginalValues(prev => {
      if (!prev || !prev.invoice_data) return prev;
      
      const newOriginalValues = { ...prev };
      const newInvoiceData = [...prev.invoice_data];
      newInvoiceData.splice(deletedIndex, 1);
      newOriginalValues.invoice_data = newInvoiceData;
      
      return newOriginalValues;
    });

    setDirtyFields(prev => {
      const newSet = new Set<string>();
      
      for (const fieldPath of prev) {
        if (fieldPath.startsWith('item_')) {
          const indexMatch = fieldPath.match(/^item_(\d+)_(.+)$/);
          if (indexMatch) {
            const itemIndex = parseInt(indexMatch[1]);
            const fieldName = indexMatch[2];
            
            if (itemIndex < deletedIndex) {
              newSet.add(fieldPath);
            } else if (itemIndex > deletedIndex) {
              const newFieldPath = `item_${itemIndex - 1}_${fieldName}`;
              newSet.add(newFieldPath);
            }
          }
        } else {
          newSet.add(fieldPath);
        }
      }
      
      return newSet;
    });
  };

  return {
    dirtyFields,
    globalDirtyOperations,
    markFieldDirty,
    clearDirtyField,
    clearAllDirty,
    markGlobalOperation,
    markItemAdded,
    markItemDeleted,
    clearItemDirtyFields,
    isFieldDirty,
    hasDirtyChanges: dirtyFields.size > 0 || globalDirtyOperations.size > 0,
    totalChanges: dirtyFields.size + globalDirtyOperations.size
  };
}; 