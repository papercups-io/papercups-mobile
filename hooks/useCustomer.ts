import * as React from 'react';

import * as API from '../api';
import {Customer} from '../types';

export default function useCustomer(
  customerId: string,
  options: {expand: Array<string>} = {expand: []}
) {
  const [customer, setCustomer] = React.useState<Customer>();
  const [error, setError] = React.useState<Error>();
  const [isFetching, setIsFetching] = React.useState(true);

  React.useEffect(() => {
    API.fetchCustomer(customerId, {
      expand: options.expand,
    })
      .then((customer) => setCustomer(customer))
      .catch((error) => setError(error))
      .finally(() => setIsFetching(false));
  });

  return {customer, isFetching, error};
}
