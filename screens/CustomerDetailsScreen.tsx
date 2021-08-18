import * as React from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import {
  Button,
  Image,
  View,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import tailwind from 'tailwind-rn';
import {Card} from 'react-native-elements';
import dayjs from 'dayjs';

import {RootStackParamList} from '../types';
import useCustomer from '../hooks/useCustomer';

type CustomerDetailsScreenProps = StackScreenProps<
  RootStackParamList,
  'CustomerDetails'
>;

const formatSeenAt = (date: string) => dayjs.utc(date).format('MMMM DD, YYYY');

export default function CustomerDetailsScreen({
  route,
  navigation,
}: CustomerDetailsScreenProps) {
  const {customerId} = route.params;
  const {customer, isFetching, error} = useCustomer(customerId, {
    expand: ['company'],
  });

  if (isFetching) {
    return <Text>loading...</Text>;
  }

  if (error != null || customer == null) {
    return <Text>Something went wrong...</Text>;
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

  return (
    <View style={tailwind('flex-1 bg-white')}>
      <SafeAreaView style={tailwind('bg-gray-50')}>
        <View style={tailwind('p-4 items-center')}>
          {avatarUrl && (
            <Image
              style={{
                ...tailwind('w-14 h-14 rounded-full mb-2'),
              }}
              source={{
                uri: avatarUrl,
              }}
            />
          )}
          <Text style={tailwind('font-bold text-lg')}>{title}</Text>
          <Button title="go back" onPress={navigation.goBack}>
            Go back
          </Button>
        </View>
      </SafeAreaView>

      <SafeAreaView style={tailwind('flex-1')}>
        <ScrollView style={tailwind('p-4')}>
          <CustomerDetailsSection
            title="Basic"
            properties={[
              {name: 'ID', value: externalId},
              {name: 'Name', value: name},
              {name: 'Email', value: email},
              {name: 'Phone', value: phone},
            ]}
          />

          <Card.Divider style={tailwind('mt-2')} />

          <CustomerDetailsSection
            title="Activity"
            properties={[
              {
                name: 'First Seen',
                value: firstSeenAt && formatSeenAt(firstSeenAt),
              },
              {
                name: 'Last Seen',
                value: lastSeenAt && formatSeenAt(lastSeenAt),
              },
              {
                name: 'Last Seen URL',
                value: pathname,
              },
            ]}
          />

          <Card.Divider style={tailwind('mt-2')} />

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
            <>
              <Card.Divider style={tailwind('mt-2')} />
              <CustomerDetailsSection
                title="Company"
                properties={[
                  {name: 'Name', value: company.name},
                  {name: 'Slack Channel', value: company.slack_channel_name},
                ]}
              />
            </>
          )}

          {hasMetadata && (
            <>
              <Card.Divider style={tailwind('mt-2')} />
              <CustomerDetailsSection
                title="Metadata"
                properties={Object.entries(metadata).map(([key, value]) => ({
                  name: key,
                  value: String(value),
                }))}
              />
            </>
          )}

          {/* Extra padding to ensure that bottom text isn't cut off */}
          <View style={tailwind('pb-6')} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

type CustomerDetailsSectionProps = {
  title: string;
  properties: Array<{
    name: string;
    value?: number | string | null;
  }>;
};

const CustomerDetailsSection = ({
  title,
  properties,
}: CustomerDetailsSectionProps) => {
  return (
    <View>
      <Text style={tailwind('font-bold mb-2 text-base')}>{title}</Text>

      {properties.map(({name, value}) => (
        <View style={tailwind('pb-2')}>
          <Text style={tailwind('text-gray-400 text-sm')}>{name}</Text>
          <Text style={tailwind('text-base')}>{value ?? 'Unknown'}</Text>
        </View>
      ))}
    </View>
  );
};
