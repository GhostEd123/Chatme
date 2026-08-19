import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "tailwind-variants";
import { Country, useCountries } from "../hooks/useCountries";

type CountryPickerProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  onCountryChange?: (country: Country) => void;
  showDialCode?: boolean;
  showPhoneInput?: boolean;
  disableNativeKeyboard?: boolean;
};

const DEFAULT_COUNTRY_CODE = "NG";

export const CountryPicker = ({
  value = "",
  onChangeText,
  onCountryChange,
  showDialCode = true,
  showPhoneInput = true,
  disableNativeKeyboard = false,
}: CountryPickerProps) => {
  const { data: countries = [], isLoading } = useCountries();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();
  const hasSyncedDefault = useRef(false);

  const detectedCountry = useMemo(() => {
    return null;
  }, []);

  const defaultCountry = useMemo(
    () => countries.find((c) => c.code === DEFAULT_COUNTRY_CODE) ?? null,
    [countries],
  );

  const displayCountry = selectedCountry || detectedCountry || defaultCountry;

  // Once the default country resolves, tell the parent — otherwise
  // the picker can visually show a country the form doesn't know about.
  useEffect(() => {
    if (hasSyncedDefault.current) return;
    if (!displayCountry) return;

    hasSyncedDefault.current = true;
    onCountryChange?.(displayCountry);
  }, [displayCountry, onCountryChange]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    return countries.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [countries, searchQuery]);

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    setModalVisible(false);
    setSearchQuery("");
    if (onCountryChange) onCountryChange(country);
  };
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View>
      <View
        className={cn(
          "flex-row items-center justify-between bg-surface rounded-xl px-4 py-2 min-h-13 border",
          isFocused
            ? "border-primary ring-1 ring-primary bg-primary-50 dark:bg-neutral-800"
            : "border-border",
        )}
      >
        <TouchableOpacity
          className={
            showPhoneInput
              ? "flex-row items-center pr-3 border-r border-border h-full"
              : "flex-row items-center h-full flex-1 justify-between"
          }
          onPress={() => setModalVisible(true)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" colorClassName="accent-primary" />
          ) : (
            <>
              <View className="flex-row items-center">
                <Text className="text-h4">{displayCountry?.flag}</Text>
                {!showPhoneInput && (
                  <Text className="ml-2 text-body-sm text-foreground">
                    {displayCountry?.name}
                  </Text>
                )}
              </View>
              {showDialCode && (
                <Text className="ml-1.5 text-body-md text-foreground">
                  {displayCountry?.dialCode}
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>
        {showPhoneInput && (
          <TextInput
            className="flex-1 ml-3 font-display-medium  text-foreground text-body-md h-full"
            placeholderTextColorClassName="accent-muted"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Phone number"
            showSoftInputOnFocus={!disableNativeKeyboard}
          />
        )}
      </View>
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/30 justify-end">
          <View
            className="bg-surface dark:bg-neutral-700 rounded-t-3xl h-3/4"
            style={{ paddingBottom: insets.bottom }}
          >
            <View className="flex-row justify-between items-center p-5 border-b border-border dark:border-neutral-500">
              <Text className="text-body-xl font-display-bold text-foreground">
                Select Country
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-body-md text-primary">Close</Text>
              </TouchableOpacity>
            </View>

            <View className="px-5 py-3 border-b border-border dark:border-neutral-500">
              <TextInput
                className="bg-background dark:bg-neutral-600 rounded-xl px-4 h-11 text-foreground text-body-md"
                placeholderTextColorClassName="accent-muted"
                placeholder="Search countries..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row items-center py-4 px-5 border-b border-border dark:border-neutral-500"
                  onPress={() => handleSelect(item)}
                >
                  <Text className="text-h4">{item.flag}</Text>
                  <Text className="flex-1 ml-3 text-body-lg text-neutral-600 dark:text-neutral-100 font-display-medium">
                    {item.name}
                  </Text>
                  {showDialCode && (
                    <Text className="text-body-md text-muted text-neutral-400 font-display-medium">
                      {item.dialCode}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
