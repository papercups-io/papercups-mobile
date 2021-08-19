import * as React from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import {
  Image,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {Icon} from 'react-native-elements/dist/icons/Icon';
import tailwind, {getColor} from 'tailwind-rn';
import dayjs from 'dayjs';

import {RootStackParamList} from '../types';
import useCustomer from '../hooks/useCustomer';
import {formatServerError, getColorByUuid} from '../utils';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type CustomerDetailsScreenProps = StackScreenProps<
  RootStackParamList,
  'CustomerDetails'
>;

const formatUtcDateTime = (datetime: string) =>
  dayjs.utc(datetime).local().format('MMMM D, hh:mm a');

const formatDate = (date: string) => dayjs(date).format('MMMM D, YYYY');

export default function CustomerDetailsScreen({
  route,
  navigation,
}: CustomerDetailsScreenProps) {
  const {customerId} = route.params;
  const insets = useSafeAreaInsets();
  const {customer, isFetching, error} = useCustomer(customerId, {
    expand: ['company'],
  });

  if (isFetching) {
    // TODO: make it possible to "go back" if this is taking too long
    return (
      <View style={tailwind('flex-1 bg-white justify-center items-center')}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !customer) {
    const errorMessage = formatServerError(
      error || new Error('Unable to retrieve customer data!')
    );

    // TODO: make it possible to "go back"
    return (
      <View style={tailwind('flex-1 bg-white justify-center items-center')}>
        <Text style={tailwind('text-base text-red-500')}>{errorMessage}</Text>
      </View>
    );
  }

  const {
    browser,
    company,
    email,
    name,
    os,
    pathname,
    phone,
    external_id: externalId,
    first_seen: firstSeenAt,
    last_seen_at: lastSeenAt,
    ip: lastIpAddress,
    profile_photo_url: avatarUrl,
    time_zone: timezone,
    metadata = {},
  } = customer;
  const hasMetadata = !!metadata && Object.keys(metadata).length > 0;
  const formattedTimezone =
    timezone && timezone.length ? timezone.split('_').join(' ') : null;
  const title = name || email || 'Anonymous User';
  const color = getColorByUuid(customerId);

  return (
    <>
      <SafeAreaView
        style={{
          ...tailwind('flex-none bg-gray-50'),
          paddingTop: insets.top,
        }}
      >
        <View style={tailwind('pt-6 px-4 flex-row items-start')}>
          <TouchableOpacity onPress={navigation.goBack}>
            <Icon
              name="chevron-left"
              type="feather"
              color={getColor('blue-500')}
              onPress={navigation.goBack}
            />
          </TouchableOpacity>
        </View>

        <View style={tailwind('items-center bg-gray-50 pb-4')}>
          {avatarUrl ? (
            <Image
              style={{
                ...tailwind('w-14 h-14 rounded-full mb-2'),
              }}
              source={{
                uri: avatarUrl,
              }}
            />
          ) : (
            <View
              style={{
                ...tailwind(
                  `mb-2 w-14 h-14 bg-${color}-500 rounded-full items-center justify-center`
                ),
              }}
            >
              <Text style={tailwind('text-white text-xl')}>
                {title.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={tailwind('font-bold text-xl')}>{title}</Text>
        </View>
      </SafeAreaView>

      <SafeAreaView style={{...tailwind('flex-1 bg-white')}}>
        <ScrollView style={tailwind('p-4')}>
          <CustomerDetailsSection
            title="Basic"
            properties={[
              {name: 'Email', value: email},
              {name: 'Phone', value: phone},
              {name: 'ID', value: externalId},
            ]}
          />

          <CustomerDetailsSection
            title="Activity"
            properties={[
              {
                name: 'First Seen',
                value: firstSeenAt ? formatDate(firstSeenAt) : null,
              },
              {
                name: 'Last Seen',
                value: lastSeenAt ? formatUtcDateTime(lastSeenAt) : null,
              },
              {
                name: 'Last Seen URL',
                value: pathname,
              },
            ]}
          />

          <CustomerDetailsSection
            title="Device"
            properties={[
              {name: 'Timezone', value: formattedTimezone},
              {
                name: 'Browser',
                value: [os, browser].filter(Boolean).join(' · ') || 'Unknown',
              },
              {name: 'IP', value: lastIpAddress},
            ]}
          />

          {company && (
            <CustomerDetailsSection
              title="Company"
              properties={[
                {name: 'Name', value: company.name},
                {name: 'Slack Channel', value: company.slack_channel_name},
              ]}
            />
          )}

          {hasMetadata && (
            <CustomerDetailsSection
              title="Metadata"
              properties={Object.entries(metadata).map(([key, value]) => ({
                name: key,
                value: String(value),
              }))}
            />
          )}

          <View style={tailwind('p-6')} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

type CustomerDetailsSectionProps = {
  title: string;
  properties: Array<{
    name: string;
    value?: number | string | null;
  }>;
  style?: any;
};

const CustomerDetailsSection = ({
  title,
  properties,
  style = {},
}: CustomerDetailsSectionProps) => {
  return (
    <View
      style={{...tailwind('pt-4 pb-2 mb-2 border-b border-gray-100'), ...style}}
    >
      <Text style={tailwind('font-bold text-lg mb-4')}>{title}</Text>

      {properties.map(({name, value}) => (
        <View key={name} style={tailwind('mb-4')}>
          <Text
            style={tailwind('text-gray-400 text-xs uppercase tracking-wide')}
          >
            {name}
          </Text>
          <Text style={tailwind('text-base text-gray-800')}>
            {value ?? 'Unknown'}
          </Text>
        </View>
      ))}
    </View>
  );
};
