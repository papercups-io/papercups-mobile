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
    setIsFetching(true);

    API.fetchCustomer(customerId, options)
      .then((customer) => setCustomer(customer))
      .catch((error) => setError(error))
      .finally(() => setIsFetching(false));
  }, [customerId]);

  return {customer, isFetching, error};
}
