import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ViewStyle, TextStyle } from "react-native";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  className?: string; // Keep for compatibility but won't be used
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string; // Keep for compatibility but won't be used
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

// Context for sharing state between Select components
const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  options: { value: string; label: string }[];
  setOptions: (options: { value: string; label: string }[]) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
  options: [],
  setOptions: () => {},
});

const Select: React.FC<SelectProps & { children: React.ReactNode }> = ({
  value,
  onValueChange,
  children,
  style,
  ...props
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [options, setOptions] = React.useState<{ value: string; label: string }[]>([]);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, options, setOptions }}>
      <View style={[styles.selectContainer, style]} {...props}>
        {children}
      </View>
    </SelectContext.Provider>
  );
};

const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, style, ...props }) => {
  const { setIsOpen } = React.useContext(SelectContext);

  return (
    <TouchableOpacity
      style={[styles.selectTrigger, style]}
      onPress={() => setIsOpen(true)}
      {...props}
    >
      {children}
      <Text style={styles.selectArrow}>▼</Text>
    </TouchableOpacity>
  );
};

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value, options } = React.useContext(SelectContext);
  const selectedOption = options.find(option => option.value === value);
  
  return (
    <Text style={styles.selectValue}>
      {selectedOption?.label || value || placeholder}
    </Text>
  );
};

const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  const { isOpen, setIsOpen, value, onValueChange } = React.useContext(SelectContext);
  const [options, setOptions] = React.useState<{ value: string; label: string }[]>([]);

  // Extract options from children
  React.useEffect(() => {
    const extractedOptions: { value: string; label: string }[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === SelectItem) {
        extractedOptions.push({
          value: child.props.value,
          label: typeof child.props.children === 'string' ? child.props.children : child.props.value,
        });
      }
    });
    setOptions(extractedOptions);
  }, [children]);

  const handleSelect = (selectedValue: string) => {
    onValueChange?.(selectedValue);
    setIsOpen(false);
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <TouchableOpacity 
        style={styles.modalOverlay} 
        onPress={() => setIsOpen(false)}
        activeOpacity={1}
      >
        <View style={styles.modalContent}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  item.value === value && styles.selectedOption
                ]}
                onPress={() => handleSelect(item.value)}
              >
                <Text style={[
                  styles.selectOptionText,
                  item.value === value && styles.selectedOptionText
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  // This component is used for extraction only, doesn't render anything
  return null;
};

const styles = StyleSheet.create({
  selectContainer: {
    position: 'relative',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    minWidth: 120,
  },
  selectValue: {
    fontSize: 14,
    color: '#111827', // gray-900
  },
  selectArrow: {
    fontSize: 10,
    color: '#6B7280', // gray-500
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    maxHeight: 300,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // gray-100
  },
  selectedOption: {
    backgroundColor: '#FEF3C7', // amber-100
  },
  selectOptionText: {
    fontSize: 14,
    color: '#111827', // gray-900
  },
  selectedOptionText: {
    fontWeight: '500',
    color: '#D97706', // amber-600
  },
});

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };