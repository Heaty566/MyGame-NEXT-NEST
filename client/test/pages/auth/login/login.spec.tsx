import * as React from 'react';
import { create, act } from 'react-test-renderer';

import LoginRoute from '../../../../pages/auth/login';
import { Provider } from 'react-redux';
import { store } from '../../../../store';
import { render } from '@testing-library/react';

describe('Login', () => {
    const mockFn = jest.fn();

    it('Render Correct Default', async () => {
        let wrapper = render(
            <Provider store={store}>
                <LoginRoute handleOnSubmit={mockFn} />
            </Provider>,
        );
        const usernameTextField = await wrapper.findByTestId('username-text-field');
        const passwordTextField = await wrapper.findByTestId('password-text-field');

        expect(usernameTextField).toBeDefined();
        expect(passwordTextField).toBeDefined();

        try {
            await wrapper.findByTestId('username-error');
        } catch (err) {
            expect(err).toBeDefined();
        }
        try {
            await wrapper.findByTestId('wave-loading');
        } catch (err) {
            expect(err).toBeDefined();
        }
    });
});
