import { useMutation } from '@apollo/client';
import { UPDATE_PROFILE, CHANGE_PASSWORD } from '@/graphql/mutations';

interface UpdateProfileInput {
  name?: string;
  email?: string;
  currency?: string;
}

interface ChangePasswordResult {
  success: boolean;
  message?: string;
}

export const useSettings = () => {
  const [updateProfileMutation, { loading: updatingProfile }] = useMutation(UPDATE_PROFILE);
  const [changePasswordMutation, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD);

  const updateProfile = async (input: UpdateProfileInput) => {
    const result = await updateProfileMutation({ variables: input });
    return result.data.updateProfile;
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<ChangePasswordResult> => {
    const result = await changePasswordMutation({
      variables: { currentPassword, newPassword },
    });
    return result.data.changePassword;
  };

  return {
    updateProfile,
    updatingProfile,
    changePassword,
    changingPassword,
  };
};
